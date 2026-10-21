import { loadingMotionPaused } from '../lib/loadingMotion'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const KLEIN_BLUE = '#2b5bff'

/* ASCII glyph rendering — every particle is drawn as a monospace character
   sampled from a texture atlas, for a technical, modern readout feel. */
const ASCII_CHARS = '01<>/\\|+-=*#%@:;'
const ATLAS_COLS = 4
const ATLAS_ROWS = 4

function buildGlyphAtlas(): THREE.Texture {
  const CELL = 128
  const cvs = document.createElement('canvas')
  cvs.width = ATLAS_COLS * CELL
  cvs.height = ATLAS_ROWS * CELL
  const ctx = cvs.getContext('2d')!
  ctx.fillStyle = '#fff'
  ctx.font = `700 ${CELL * 0.7}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ASCII_CHARS.split('').forEach((ch, i) => {
    ctx.fillText(
      ch,
      (i % ATLAS_COLS) * CELL + CELL / 2,
      Math.floor(i / ATLAS_COLS) * CELL + CELL / 2 + CELL * 0.05,
    )
  })
  const tex = new THREE.CanvasTexture(cvs)
  tex.flipY = false
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = true
  return tex
}

/** Points-as-glyphs material. `worldSize` matches PointsMaterial semantics. */
function makeGlyphMaterial(atlas: THREE.Texture, worldSize: number, opacity: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAtlas: { value: atlas },
      uSize: { value: worldSize },
      uScale: { value: 540 }, // drawingBufferHeight / 2 — set on init/resize
      uOpacity: { value: opacity },
    },
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      attribute float aGlyph;
      varying vec3 vColor;
      varying float vGlyph;
      uniform float uSize;
      uniform float uScale;
      void main() {
        vColor = color;
        vGlyph = aGlyph;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (uScale / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vGlyph;
      void main() {
        vec2 cell = vec2(mod(vGlyph, ${ATLAS_COLS}.0), floor(vGlyph / ${ATLAS_COLS}.0));
        vec2 uv = (cell + gl_PointCoord) / vec2(${ATLAS_COLS}.0, ${ATLAS_ROWS}.0);
        float a = texture2D(uAtlas, uv).a;
        a = smoothstep(0.16, 0.6, a); // harden the glyph edges — crisp readout
        if (a < 0.04) discard;
        gl_FragColor = vec4(vColor, a * uOpacity);
      }
    `,
  })
}

function addGlyphAttr(geo: THREE.BufferGeometry, n: number) {
  const g = new Float32Array(n)
  for (let i = 0; i < n; i++) g[i] = Math.floor(Math.random() * ASCII_CHARS.length)
  geo.setAttribute('aGlyph', new THREE.BufferAttribute(g, 1))
}

/** Uniform-ish points on a sphere surface. */
function spherePoints(radius: number, count: number, jitter = 0) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const r = Math.sqrt(1 - u * u)
    const rr = radius * (1 + (Math.random() - 0.5) * jitter)
    arr[i * 3] = rr * r * Math.cos(th)
    arr[i * 3 + 1] = rr * u
    arr[i * 3 + 2] = rr * r * Math.sin(th)
  }
  return arr
}

/** Point data for the globe, built in a worker so the page counter never stalls. */
type GlobeData = { positions: Float32Array; accentPositions: Float32Array; borderPos: Float32Array }
let cachedGlobeData: Promise<GlobeData> | undefined
function loadGlobeData(radius: number): Promise<GlobeData> {
  if (cachedGlobeData) return cachedGlobeData
  cachedGlobeData = new Promise<GlobeData>((resolve, reject) => {
    const w = new Worker(new URL('./globeData.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = e => { resolve(e.data as GlobeData); w.terminate() }
    w.onerror = err => { cachedGlobeData = undefined; reject(err); w.terminate() }
    w.postMessage({ radius })
  })
  return cachedGlobeData
}

/** Soft radial glow sprite texture for the sun. */
function buildGlowTexture(): THREE.Texture {
  const S = 256
  const cvs = document.createElement('canvas')
  cvs.width = cvs.height = S
  const ctx = cvs.getContext('2d')!
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.25, 'rgba(240,244,255,0.32)')
  g.addColorStop(0.6, 'rgba(180,200,255,0.10)')
  g.addColorStop(1, 'rgba(160,180,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(cvs)
}

export default function ParticleGlobe({
  className,
  onReady,
  onProgress,
}: {
  className?: string
  onReady?: () => void
  onProgress?: (p: number) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let cancelled = false
    let cleanup: (() => void) | undefined

    const init = async () => {
      onProgress?.(0.12)
      const R = 2.05
      const globeData = await loadGlobeData(R)
      onProgress?.(0.58)
      const land = { positions: globeData.positions, accentPositions: globeData.accentPositions }
      const borderPos = globeData.borderPos
      if (cancelled) return

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 200)
      camera.position.set(0, 0.3, 7.7)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.3 : 1.75))
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      mount.appendChild(renderer.domElement)

      /* ---------- deep-space vignette ----------
         No literal sun or moon — just the earth, one satellite, a sparse
         star field, and a soft distant glare that hints at sunlight. */
      const group = new THREE.Group() // the earth
      group.position.set(-1.15, 0, 0)
      group.rotation.z = 0.32 // axial tilt
      scene.add(group)

      // sparse star field — far shell, a few Klein-blue sparks
      const starCount = 1500
      const starPos = new Float32Array(starCount * 3)
      const starCol = new Float32Array(starCount * 3)
      const klein = new THREE.Color(KLEIN_BLUE)
      for (let i = 0; i < starCount; i++) {
        const u = Math.random() * 2 - 1
        const th = Math.random() * Math.PI * 2
        const r = Math.sqrt(1 - u * u)
        const rr = 38 + Math.random() * 20
        starPos[i * 3] = rr * r * Math.cos(th)
        starPos[i * 3 + 1] = rr * u
        starPos[i * 3 + 2] = rr * r * Math.sin(th)
        if (Math.random() < 0.06) {
          starCol[i * 3] = klein.r; starCol[i * 3 + 1] = klein.g; starCol[i * 3 + 2] = klein.b
        } else {
          const v = 0.3 + Math.random() * 0.6
          starCol[i * 3] = v; starCol[i * 3 + 1] = v; starCol[i * 3 + 2] = v * 1.02
        }
      }
      const starGeo = new THREE.BufferGeometry()
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
      starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3))
      const starMat = new THREE.PointsMaterial({
        size: 0.11, vertexColors: true, transparent: true, opacity: 0.7,
        depthWrite: false, sizeAttenuation: true,
      })
      const stars = new THREE.Points(starGeo, starMat)
      scene.add(stars)

      const glyphAtlas = buildGlyphAtlas()

      // distant sunlight — a soft additive glare far off the upper right,
      // felt rather than seen; no sun body, just the light
      const glowTex = buildGlowTexture()
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, blending: THREE.AdditiveBlending, transparent: true,
        opacity: 0.3, depthWrite: false,
      }))
      glow.scale.setScalar(6.5)
      glow.position.set(7.5, 2.6, -9)
      scene.add(glow)

      // faint ocean dot sphere for volume
      const oceanCount = 900
      const oceanGeo = new THREE.BufferGeometry()
      oceanGeo.setAttribute('position', new THREE.BufferAttribute(spherePoints(R, oceanCount), 3))
      const oceanMat = new THREE.PointsMaterial({
        size: 0.012, color: 0x3a3f46, transparent: true, opacity: 0.35, depthWrite: false,
      })
      group.add(new THREE.Points(oceanGeo, oceanMat))

      // land points (with gentle hover repulsion)
      const base = land.positions
      const count = base.length / 3
      const pos = new Float32Array(base)
      const off = new Float32Array(count * 3)
      const vel = new Float32Array(count * 3)
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const v = 0.74 + Math.random() * 0.26
        colors[i * 3] = v; colors[i * 3 + 1] = v; colors[i * 3 + 2] = v
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      addGlyphAttr(geo, count)
      const mat = makeGlyphMaterial(glyphAtlas, 0.106, 1.0)
      group.add(new THREE.Points(geo, mat))

      // Klein-blue accent glyphs
      const accentGeo = new THREE.BufferGeometry()
      accentGeo.setAttribute('position', new THREE.BufferAttribute(land.accentPositions, 3))
      const accentCount = land.accentPositions.length / 3
      const accentColors = new Float32Array(accentCount * 3)
      for (let i = 0; i < accentCount; i++) {
        accentColors[i * 3] = klein.r
        accentColors[i * 3 + 1] = klein.g
        accentColors[i * 3 + 2] = klein.b
      }
      accentGeo.setAttribute('color', new THREE.BufferAttribute(accentColors, 3))
      addGlyphAttr(accentGeo, accentCount)
      const accentMat = makeGlyphMaterial(glyphAtlas, 0.15, 0.9)
      group.add(new THREE.Points(accentGeo, accentMat))

      // country borders — Klein-blue glyphs along every shared frontier
      const borderGeo = new THREE.BufferGeometry()
      borderGeo.setAttribute('position', new THREE.BufferAttribute(borderPos, 3))
      const borderCount = borderPos.length / 3
      const borderColors = new Float32Array(borderCount * 3)
      for (let i = 0; i < borderCount; i++) {
        borderColors[i * 3] = klein.r
        borderColors[i * 3 + 1] = klein.g
        borderColors[i * 3 + 2] = klein.b
      }
      borderGeo.setAttribute('color', new THREE.BufferAttribute(borderColors, 3))
      addGlyphAttr(borderGeo, borderCount)
      const borderMat = makeGlyphMaterial(glyphAtlas, 0.09, 0.85)
      group.add(new THREE.Points(borderGeo, borderMat))

      // Satellite — particle-built, 3D-realistic: a bus body, two solar
      // wings, an antenna mast and a parabolic dish, all sampled into
      // shimmering white/silver points, sunlit-side shaded, oriented
      // along its velocity as it orbits (earth-local, child of group).
      const satGroup = new THREE.Group()
      group.add(satGroup)

      /** Sample the surface of a box into jittered, shaded points. */
      const sampleBox = (
        acc: { pos: number[]; col: number[] },
        cx: number, cy: number, cz: number,
        w: number, h: number, d: number,
        step: number,
        shade: (x: number, y: number, z: number) => [number, number, number],
      ) => {
        const nx = Math.max(1, Math.round(w / step))
        const ny = Math.max(1, Math.round(h / step))
        const nz = Math.max(1, Math.round(d / step))
        for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) for (let k = 0; k <= nz; k++) {
          if (!(i === 0 || i === nx || j === 0 || j === ny || k === 0 || k === nz)) continue
          const x = cx - w / 2 + (i / nx) * w + (Math.random() - 0.5) * step * 0.4
          const y = cy - h / 2 + (j / ny) * h + (Math.random() - 0.5) * step * 0.4
          const z = cz - d / 2 + (k / nz) * d + (Math.random() - 0.5) * step * 0.4
          acc.pos.push(x, y, z)
          const [r, g, b] = shade(x, y, z)
          acc.col.push(r, g, b)
        }
      }

      const buildSatellite = (scale: number) => {
        const acc = { pos: [] as number[], col: [] as number[] }
        const S = scale
        // bus body — white ceramics, brighter toward the sun (+y/+z)
        sampleBox(acc, 0, 0, 0, 0.16 * S, 0.16 * S, 0.22 * S, 0.016 * S, (_x, y, z) => {
          const lit = 1 + (y > 0 ? 0.22 : -0.18) + (z > 0 ? 0.14 : -0.1)
          const v = Math.min(1, (0.55 + Math.random() * 0.3) * lit)
          return [v, v, v * 1.02]
        })
        // neutral grey instrument band around the body waist
        sampleBox(acc, 0, 0, 0.01 * S, 0.165 * S, 0.035 * S, 0.225 * S, 0.015 * S, () => {
          const w = 0.42 + Math.random() * 0.2
          return [w, w, w * 1.02]
        })
        // two solar wings — pale silver cells, sun-facing side brighter,
        // occasional specular glints
        const wingShade = (_x: number, _y: number, z: number): [number, number, number] => {
          if (Math.random() < 0.12) return [0.98, 0.98, 1] // specular glint
          const v = (0.3 + Math.random() * 0.38) * (z > 0 ? 1.25 : 0.72)
          return [v, v, v * 1.02]
        }
        sampleBox(acc, -0.31 * S, 0, 0, 0.44 * S, 0.15 * S, 0.012 * S, 0.014 * S, wingShade)
        sampleBox(acc, 0.31 * S, 0, 0, 0.44 * S, 0.15 * S, 0.012 * S, 0.014 * S, wingShade)
        // antenna mast + bright tip
        sampleBox(acc, 0, 0.13 * S, 0, 0.012 * S, 0.1 * S, 0.012 * S, 0.012 * S, () => [0.85, 0.86, 0.88])
        acc.pos.push(0, 0.19 * S, 0)
        acc.col.push(1, 1, 1)
        // small parabolic dish on a side arm, concave toward -z
        const dishR = 0.055 * S
        for (let i = 0; i < 42; i++) {
          const a = Math.random() * Math.PI * 2
          const rr = Math.sqrt(Math.random()) * dishR
          const dx = Math.cos(a) * rr
          const dy = Math.sin(a) * rr
          const dz = 0.02 * S * (rr / dishR) * (rr / dishR) // shallow bowl
          acc.pos.push(dx, -0.02 * S + dy, -0.13 * S + dz)
          const v = 0.6 + (1 - rr / dishR) * 0.4
          acc.col.push(v, v, v)
        }
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(acc.pos), 3))
        g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(acc.col), 3))
        return g
      }

      const SAT_DEFS = [
        { r: 2.62, speed: 0.3, tilt: 0.42, phase: 0.4, scale: 0.42 },
      ]
      const sats = SAT_DEFS.map(s => {
        const geoS = buildSatellite(s.scale)
        const matS = new THREE.PointsMaterial({
          size: 0.013, vertexColors: true, transparent: true, opacity: 0,
          sizeAttenuation: true, depthWrite: false,
        })
        const holder = new THREE.Group() // oriented along velocity each frame
        holder.add(new THREE.Points(geoS, matS))
        satGroup.add(holder)
        // faint orbital path
        const pts: THREE.Vector3[] = []
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2
          pts.push(new THREE.Vector3(
            Math.cos(a) * s.r,
            Math.sin(a) * Math.sin(s.tilt) * s.r,
            Math.sin(a) * Math.cos(s.tilt) * s.r,
          ))
        }
        const ring = new THREE.LineLoop(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: 0x9aa0a8, transparent: true, opacity: 0 }),
        )
        satGroup.add(ring)
        // per-particle scatter state (hover disperse / regroup)
        const n = geoS.attributes.position.count
        return {
          holder, mat: matS, geo: geoS, ring, ...s,
          base: new Float32Array(geoS.attributes.position.array),
          off: new Float32Array(n * 3),
          vel: new Float32Array(n * 3),
          scat: 0,
          quiet: true,
        }
      })

      // interaction state
      let intro = 0
      group.scale.setScalar(0.55)
      let mx = 0, my = 0
      let hoverF = 0
      let hovering = false
      const ndc = new THREE.Vector2(10, 10)
      const raycaster = new THREE.Raycaster()
      const planePoint = new THREE.Vector3()
      const worldCenter = new THREE.Vector3()
      const worldTarget = new THREE.Vector3()
      const localMouse = new THREE.Vector3(999, 999, 999)

      const onMouse = (e: PointerEvent) => {
        mx = (e.clientX / innerWidth - 0.5) * 2
        my = (e.clientY / innerHeight - 0.5) * 2
        ndc.set(mx, -my)
      }
      const onEnter = () => { hovering = true }
      const onLeave = () => { hovering = false }
      addEventListener('pointermove', onMouse)
      mount.addEventListener('pointerenter', onEnter)
      mount.addEventListener('pointerleave', onLeave)

      const REPEL_R = 1.05
      const clock = new THREE.Clock()
      let raf = 0
      let onScreen = true

      const tick = () => {
        raf = 0
        // parked: the dive has faded the hero canvas out — stop burning GPU
        // frames on an invisible globe until the visitor scrolls back up
        if (!onScreen || loadingMotionPaused() || mount.dataset.globePark === '1') return
        const dt = Math.min(clock.getDelta(), 0.05)
        intro = Math.min(1, intro + dt * 0.65)
        const ease = 1 - Math.pow(1 - intro, 3)
        group.scale.setScalar(0.55 + 0.45 * ease)

        hoverF += ((hovering ? 1 : 0) - hoverF) * 0.06

        // ambient motion — star field drift + breathing, the far glare
        // pulsing gently; the earth only turns on its own axis now
        stars.rotation.y += dt * 0.0022
        starMat.opacity = 0.62 + Math.sin(clock.elapsedTime * 0.5) * 0.1
        glow.material.opacity = (0.26 + Math.sin(clock.elapsedTime * 0.8) * 0.06) * ease

        group.rotation.y += dt * 0.07 // slow self-rotation
        group.rotation.x += ((my * 0.08) - group.rotation.x) * 0.03
        group.updateMatrixWorld()

        // intersect the pointer ray with the actual globe sphere so every
        // point on the surface responds, not just one projection plane
        raycaster.setFromCamera(ndc, camera)
        group.getWorldPosition(worldCenter)
        const ro = raycaster.ray.origin
        const rd = raycaster.ray.direction
        const cx = worldCenter.x, cy = worldCenter.y, cz = worldCenter.z
        const ocx = ro.x - cx, ocy = ro.y - cy, ocz = ro.z - cz
        const b = ocx * rd.x + ocy * rd.y + ocz * rd.z
        const c = ocx * ocx + ocy * ocy + ocz * ocz - (R * 1.05) * (R * 1.05)
        const disc = b * b - c
        if (disc > 0) {
          const tt = -b - Math.sqrt(disc)
          planePoint.copy(ro).addScaledVector(rd, Math.max(tt, 0))
        } else {
          // miss: use the ray's closest point to the sphere centre
          planePoint.copy(ro).addScaledVector(rd, -b)
        }
        localMouse.copy(planePoint)
        group.worldToLocal(localMouse)

        // gentle repulsion only
        const strength = 0.055 * hoverF
        if (strength > 0.0005 || Math.abs(vel[0]) > 1e-7) {
          const lx = localMouse.x, ly = localMouse.y, lz = localMouse.z
          for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const dx = base[i3] + off[i3] - lx
            const dy = base[i3 + 1] + off[i3 + 1] - ly
            const dz2 = base[i3 + 2] + off[i3 + 2] - lz
            const d2 = dx * dx + dy * dy + dz2 * dz2
            if (d2 < REPEL_R * REPEL_R && d2 > 1e-8) {
              const d = Math.sqrt(d2)
              const f = (1 - d / REPEL_R)
              const push = f * f * strength / d
              vel[i3] += dx * push
              vel[i3 + 1] += dy * push
              vel[i3 + 2] += dz2 * push
            }
            vel[i3] += -off[i3] * 0.02
            vel[i3 + 1] += -off[i3 + 1] * 0.02
            vel[i3 + 2] += -off[i3 + 2] * 0.02
            vel[i3] *= 0.92; vel[i3 + 1] *= 0.92; vel[i3 + 2] *= 0.92
            off[i3] += vel[i3]; off[i3 + 1] += vel[i3 + 1]; off[i3 + 2] += vel[i3 + 2]
            pos[i3] = base[i3] + off[i3]
            pos[i3 + 1] = base[i3 + 1] + off[i3 + 1]
            pos[i3 + 2] = base[i3 + 2] + off[i3 + 2]
          }
          geo.attributes.position.needsUpdate = true
        }

        accentMat.uniforms.uOpacity.value = 0.65 + Math.sin(clock.elapsedTime * 1.6) * 0.25

        // satellites glide along their inclined orbits, nose aligned to
        // the direction of travel, particle sheen breathing softly;
        // near the pointer their particles burst apart, then regroup
        const elapsed = clock.elapsedTime
        for (const s of sats) {
          const a = s.phase + elapsed * s.speed
          const px = Math.cos(a) * s.r
          const py = Math.sin(a) * Math.sin(s.tilt) * s.r
          const pz = Math.sin(a) * Math.cos(s.tilt) * s.r
          s.holder.position.set(px, py, pz)
          // face the direction of motion (convert the local lookahead
          // point to world space for lookAt)
          const a2 = a + (s.speed >= 0 ? 0.02 : -0.02)
          worldTarget.set(
            Math.cos(a2) * s.r,
            Math.sin(a2) * Math.sin(s.tilt) * s.r,
            Math.sin(a2) * Math.cos(s.tilt) * s.r,
          )
          satGroup.localToWorld(worldTarget)
          s.holder.lookAt(worldTarget)
          // slow panel drift around the flight axis for a lived-in feel
          s.holder.rotateZ(Math.sin(elapsed * 0.35 + s.phase * 3) * 0.002)
          s.mat.opacity = (0.78 + Math.sin(elapsed * 2.1 + s.phase * 5) * 0.18) * ease
          ;(s.ring.material as THREE.LineBasicMaterial).opacity = 0.13 * ease

          // hover scatter: distance from the pointer ray to the satellite
          s.holder.getWorldPosition(planePoint)
          const dRay = raycaster.ray.distanceToPoint(planePoint)
          const target = dRay < 0.85 ? 1 - dRay / 0.85 : 0
          s.scat += (target - s.scat) * 0.08
          if (s.scat > 0.004) s.quiet = false
          if (!s.quiet) {
            const k = 0.045 * s.scat
            const arr = s.geo.attributes.position.array as Float32Array
            let settle = s.scat <= 0.004
            for (let i = 0; i < s.off.length; i += 3) {
              const bx = s.base[i], by = s.base[i + 1], bz = s.base[i + 2]
              const len = Math.sqrt(bx * bx + by * by + bz * bz) || 1
              s.vel[i] += (bx / len) * k + (Math.random() - 0.5) * k * 0.7
              s.vel[i + 1] += (by / len) * k + (Math.random() - 0.5) * k * 0.7
              s.vel[i + 2] += (bz / len) * k + (Math.random() - 0.5) * k * 0.7
              s.vel[i] += -s.off[i] * 0.03
              s.vel[i + 1] += -s.off[i + 1] * 0.03
              s.vel[i + 2] += -s.off[i + 2] * 0.03
              s.vel[i] *= 0.88; s.vel[i + 1] *= 0.88; s.vel[i + 2] *= 0.88
              s.off[i] += s.vel[i]; s.off[i + 1] += s.vel[i + 1]; s.off[i + 2] += s.vel[i + 2]
              if (settle && (Math.abs(s.off[i]) > 0.002 || Math.abs(s.off[i + 1]) > 0.002 || Math.abs(s.off[i + 2]) > 0.002)) settle = false
              arr[i] = bx + s.off[i]
              arr[i + 1] = by + s.off[i + 1]
              arr[i + 2] = bz + s.off[i + 2]
            }
            s.geo.attributes.position.needsUpdate = true
            if (settle) {
              s.off.fill(0); s.vel.fill(0)
              arr.set(s.base)
              s.quiet = true
            }
          }
        }

        renderer.render(scene, camera)
        wake()
      }
      const wake = () => {
        if (!raf && onScreen && !loadingMotionPaused() && mount.dataset.globePark !== '1') {
          raf = requestAnimationFrame(tick)
        }
      }

      addEventListener('portfolio-loading-motion', wake)
      // Home un-parks the globe when the dive scrolls back up; the clock is
      // delta-clamped, so resuming never jumps the animation state.
      addEventListener('portfolio-globe-resume', wake)
      onProgress?.(0.92)
      onReady?.()
      wake()

      // the globe is the heaviest thing on the page: stop its particle physics
      // once the hero has scrolled away (a hidden tab already stops rAF on its own)
      const io = new IntersectionObserver(([entry]) => {
        onScreen = entry.isIntersecting
        if (onScreen) wake()
      })
      io.observe(mount)

      const onResize = () => {
        camera.aspect = mount.clientWidth / mount.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(mount.clientWidth, mount.clientHeight)
        const halfBufH = renderer.domElement.height / 2
        mat.uniforms.uScale.value = halfBufH
        accentMat.uniforms.uScale.value = halfBufH
        borderMat.uniforms.uScale.value = halfBufH
      }
      onResize()
      addEventListener('resize', onResize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        io.disconnect()
      removeEventListener('portfolio-loading-motion', wake)
        removeEventListener('portfolio-globe-resume', wake)
        removeEventListener('pointermove', onMouse)
        removeEventListener('resize', onResize)
        mount.removeEventListener('pointerenter', onEnter)
        mount.removeEventListener('pointerleave', onLeave)
        geo.dispose(); mat.dispose(); oceanGeo.dispose(); oceanMat.dispose()
        accentGeo.dispose(); accentMat.dispose(); glyphAtlas.dispose()
        borderGeo.dispose(); borderMat.dispose()
        starGeo.dispose(); starMat.dispose()
        glowTex.dispose(); glow.material.dispose()
        for (const s of sats) {
          s.geo.dispose()
          s.mat.dispose()
          s.ring.geometry.dispose()
          ;(s.ring.material as THREE.Material).dispose()
        }
        renderer.dispose()
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
      }
    }

    init()
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [])

  return <div ref={mountRef} className={className} aria-hidden />
}
