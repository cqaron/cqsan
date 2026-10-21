import { loadingMotionPaused } from '../lib/loadingMotion'
import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import { SHIBA_COLS, SHIBA_PITCH, SHIBA_ROWS, SHIBA_SPRITE } from '../lib/shibaSprite'

const KLEIN = new THREE.Color('#2b5bff')

/* ------------------------------------------------------------------
   CRT screen content: the classic offline T-Rex runner, black-ground,
   pixel sprites, always running. Drawn every frame onto the screen
   texture; the dim-to-black dive logic is untouched — the dim overlay
   still swallows whatever is on the screen.
------------------------------------------------------------------ */
/* tiny 3x5 pixel font for the screen's name tag */
const PIXEL_FONT: Record<string, string[]> = {
  C: ['###', '#..', '#..', '#..', '###'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  E: ['###', '#..', '###', '#..', '###'],
  N: ['#.#', '###', '###', '#.#', '#.#'],
  Q: ['###', '#.#', '#.#', '###', '..#'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  '.': ['...', '...', '...', '...', '.#.'],
}

function makeDinoScreen(cvs: HTMLCanvasElement) {
  const ctx = cvs.getContext('2d')!
  const W = cvs.width, H = cvs.height
  const PS = 20 // a touch smaller so the two-line tag stays clear of the shiba
  const LINES = ['CHEN', 'QI']

  // shiba: white scanline bars (noise, breath, sway, pointer parallax)
  const COLS = SHIBA_COLS, ROWS = SHIBA_ROWS
  const SH = 390                                 // fills most of the panel so it reads from far / on phones
  const CH = SH / ROWS                           // row height
  const SW = SH * COLS / (ROWS * SHIBA_PITCH)    // keeps sprite aspect
  const CW = SW / COLS                           // column width
  const SX = Math.round(W - SW - 18)             // parked on the right
  const SY = Math.round((H - SH) * 0.62)         // lower third, sits under the name tag
  const INK = '#eceef4'
  const INTRO = 1.4
  const grid: number[][] = SHIBA_SPRITE.map((line) => Array.from(line, (ch) => ch.charCodeAt(0) - 48))
  const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
  const ease = (x: number) => 1 - Math.pow(1 - x, 3)
  let tx = 0, ty = 0, px = 0, py = 0
  window.addEventListener('pointermove', (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2
    ty = (e.clientY / window.innerHeight - 0.5) * 2
  })
  let t = 0

  return (dt: number) => {
    t += dt
    px += (tx - px) * 0.06
    py += (ty - py) * 0.06
    ctx.fillStyle = '#0b0b0d'
    ctx.fillRect(0, 0, W, H)
    // intro: rows wipe in top to bottom
    const reveal = ease(Math.min(1, t / INTRO)) * ROWS
    const sway = Math.sin(t * 0.45) * 0.8
    const ox = SX + sway + px * 3
    // card-like bob: slow sine, small amplitude, no snap
    const oy = SY + py * 2 + Math.sin(t * 1.35) * 7
    const jit = Math.floor(t * 6)
    // glitch: rare, small — a hint of noise, not a tear
    const gt = Math.floor(t * 7)
    ctx.fillStyle = INK
    for (let r = 0; r < ROWS; r++) {
      if (r > reveal) break
      const breath = 0.94 + 0.06 * Math.sin(t * 0.55 + r * 0.18)
      const j = hash(r * 7 + jit)
      const g = hash(r * 13 + gt * 31)
      let rowX = ox + (j < 0.05 ? (j / 0.05 - 0.5) * 2.2 : 0)
      if (g > 0.985) rowX += (hash(r + gt) - 0.5) * 6     // rare, tiny band slip
      else if (g < 0.008) rowX -= 2
      const y = oy + r * CH
      const line = grid[r]
      let c = 0
      while (c < COLS) {
        const v = line[c]
        if (v <= 0) { c++; continue }
        let e = c + 1
        while (e < COLS && line[e] === v) e++
        const h = Math.max((v / 9) * CH * breath, v >= 3 ? CH * 0.48 : CH * 0.28)
        ctx.fillRect(rowX + c * CW, y + (CH - h) / 2, (e - c) * CW, h)
        c = e
      }
    }
    // name tag, top left, stacked: CHEN / QI
    ctx.fillStyle = '#f2f3f7'
    LINES.forEach((line, li) => {
      const y0 = 22 + li * PS * 6
      for (let i = 0; i < line.length; i++) {
        const glyph = PIXEL_FONT[line[i]]
        if (!glyph) continue
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 3; c++) {
            if (glyph[r][c] === '#') ctx.fillRect(16 + i * (PS * 4) + c * PS, y0 + r * PS, PS, PS)
          }
        }
      }
    })
  }
}

interface Acc { pos: number[]; col: number[] }

/** Sample a box's surface into jittered, lit-shaded particles. */
function sampleBox(
  acc: Acc,
  cx: number, cy: number, cz: number,
  w: number, h: number, d: number,
  step: number,
  shade: (x: number, y: number, z: number) => [number, number, number],
) {
  const nx = Math.max(1, Math.round(w / step))
  const ny = Math.max(1, Math.round(h / step))
  const nz = Math.max(1, Math.round(d / step))
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) for (let k = 0; k <= nz; k++) {
    if (!(i === 0 || i === nx || j === 0 || j === ny || k === 0 || k === nz)) continue
    const x = cx - w / 2 + (i / nx) * w + (Math.random() - 0.5) * step * 0.5
    const y = cy - h / 2 + (j / ny) * h + (Math.random() - 0.5) * step * 0.5
    const z = cz - d / 2 + (k / nz) * d + (Math.random() - 0.5) * step * 0.5
    acc.pos.push(x, y, z)
    const [r, g, b] = shade(x, y, z)
    acc.col.push(r, g, b)
  }
}

/** Round soft dot for the particle points. Without a map, PointsMaterial draws
    every particle as a hard SQUARE, and the overlapping squares read as the
    grey/white mosaic blocks that flashed in and out on scroll. */
function makeDotTexture() {
  const cvs = document.createElement('canvas')
  cvs.width = 64; cvs.height = 64
  const ctx = cvs.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.55, 'rgba(255,255,255,0.9)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(cvs)
}

/* ------------------------------------------------------------------
   Physical contact-shadow engine.
   The scene is built from particles (THREE.Points), and Three.js shadow
   maps never apply to points — so instead of a screen-space blob we
   synthesise each shadow the way light actually behaves on a desk:
   1. the light is a single direction (upper-front-right, matching the
      shell shading where top / +z / +x are the lit sides);
   2. the box's eight corners are projected onto the floor plane along
      that direction — the silhouette is the convex hull of those points,
      so the shadow carries the object's true footprint, light offset and
      stretch (a tall cabinet throws a long one, a low slab a tight one);
   3. the fill is three composited passes mirroring real light — but kept
      LIGHT and DIFFUSE on purpose: this is a particle world, so the shadow
      reads as a soft wash that pools gently under each object, never as a
      solid patch (penumbra ∝ object height → mid body → soft contact).
   Rasterised once per object at init; runtime cost is one flat plane each.
------------------------------------------------------------------ */
const LIGHT_DIR = new THREE.Vector3(-0.18, -1, -0.25).normalize()

/* Render layers for the three-pass frame (see tick): the gear's invisible
   depth silhouettes, the backdrop code wall that is depth-tested against
   them, and the main scene (everything else stays on the default layer 0). */
const LAYER_DEPTH = 1
const LAYER_CODE = 2

/** Convex hull of xz points (Andrew's monotone chain). */
function convexHullXZ(pts: THREE.Vector3[]): THREE.Vector3[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z)
  const cross = (o: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3) =>
    (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const half = (src: THREE.Vector3[]) => {
    const out: THREE.Vector3[] = []
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop()
      out.push(q)
    }
    return out
  }
  return [...half(p).slice(0, -1), ...half([...p].reverse()).slice(0, -1)]
}

/** Build the projected contact shadow for a box standing on the floor.
    Returns the texture plus the world-space bbox of the projected hull so
    the caller can lay a flat plane exactly underneath it. */
function makeBoxShadow(
  cx: number, cz: number, w: number, h: number, d: number, floorY: number,
  alpha = 0.28, res = 110,
) {
  const project = (x: number, y: number, z: number) => {
    const t = (floorY - y) / LIGHT_DIR.y
    return new THREE.Vector3(x + t * LIGHT_DIR.x, 0, z + t * LIGHT_DIR.z)
  }
  const corners: THREE.Vector3[] = []
  for (const sx of [cx - w / 2, cx + w / 2])
    for (const sy of [floorY, floorY + h])
      for (const sz of [cz - d / 2, cz + d / 2])
        corners.push(project(sx, sy, sz))
  const hull = convexHullXZ(corners)
  const base = [
    project(cx - w / 2, floorY, cz - d / 2), project(cx + w / 2, floorY, cz - d / 2),
    project(cx + w / 2, floorY, cz + d / 2), project(cx - w / 2, floorY, cz + d / 2),
  ]
  // penumbra width grows with the object's height (a taller box occludes
  // more of a finite light); generous and soft by default — light, airy,
  // diffuse, never a patch
  const penumbra = Math.min(0.4, Math.max(0.12, 0.08 + h * 0.1))
  const pad = penumbra + 0.1
  const minX = Math.min(...hull.map(p => p.x)) - pad
  const maxX = Math.max(...hull.map(p => p.x)) + pad
  const minZ = Math.min(...hull.map(p => p.z)) - pad
  const maxZ = Math.max(...hull.map(p => p.z)) + pad
  const Wc = Math.ceil((maxX - minX) * res), Hc = Math.ceil((maxZ - minZ) * res)
  const cvs = document.createElement('canvas')
  cvs.width = Wc; cvs.height = Hc
  const ctx = cvs.getContext('2d')!
  const PX = (x: number) => (x - minX) * res
  const PZ = (z: number) => (z - minZ) * res
  const trace = (poly: THREE.Vector3[]) => {
    ctx.beginPath()
    poly.forEach((p, i) => { const X = PX(p.x), Y = PZ(p.z); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y) })
    ctx.closePath()
  }
  ctx.fillStyle = '#000'
  // pass 1 — the full silhouette at the widest, softest blur: the diffuse wash
  ctx.filter = `blur(${(penumbra * res).toFixed(1)}px)`
  ctx.globalAlpha = alpha * 0.37
  trace(hull); ctx.fill()
  // pass 2 — same silhouette, half the blur: a whisper of body, never a core
  ctx.filter = `blur(${(penumbra * 0.55 * res).toFixed(1)}px)`
  ctx.globalAlpha = alpha * 0.27
  trace(hull); ctx.fill()
  // pass 3 — the base footprint, very softly blurred and barely stronger:
  // the contact only darkens a touch, so nothing reads as a solid patch
  ctx.filter = `blur(${(penumbra * 0.5 * res).toFixed(1)}px)`
  ctx.globalAlpha = alpha * 0.13
  trace(base); ctx.fill()
  ctx.filter = 'none'
  ctx.globalAlpha = 1
  const texture = new THREE.CanvasTexture(cvs)
  // the canvas is sized to the hull (non-power-of-two): skip mips so the
  // falloff stays exactly as authored on every GPU
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  return { texture, width: maxX - minX, height: maxZ - minZ, centerX: (minX + maxX) / 2, centerZ: (minZ + maxZ) / 2 }
}

/**
 * A particle-built Macintosh with its retro mechanical keyboard, standing
 * upright on a desk, with soft contact shadows right under the gear. Behind
 * it, a wall of falling code (CodeRain's canvas, textured on a backdrop
 * plane) is occluded by the gear through a depth prepass, so the machines
 * read as solid objects in front of the rain. Scrolling dollies the camera
 * in; the site on the CRT dims to black, and the camera dives THROUGH the
 * black screen into the darkness beyond.
 */
export default function MacScene({ progress, rainCanvasRef }: {
  progress: { current: number }
  rainCanvasRef: MutableRefObject<HTMLCanvasElement | null>
}) {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    /* The route veil draws its three lines on this same main thread, so a
       scene assembled in one blocking pass read as a hard stall in the
       middle of the transition. The build is therefore chunked: every heavy
       section yields one frame, and the machine materialises group by group
       while the lines keep travelling. */
    let cancelled = false
    let teardown: (() => void) | null = null
    const frame = () => new Promise<void>(res => {
      let done = false
      const fin = () => { if (!done) { done = true; res() } }
      requestAnimationFrame(() => window.setTimeout(fin, 0))
      window.setTimeout(fin, 120) // rAF is suspended in background tabs
    })

    const build = async (mount: HTMLDivElement) => {
      mount.dataset.scenePending = 'true'
      let raf = 0
      let io: IntersectionObserver | null = null
      let onScreen = true
      // every GPU resource the build creates, so an interrupted build still cleans up
      const geos: THREE.BufferGeometry[] = []
      const mats: THREE.Material[] = []
      const texes: THREE.Texture[] = []

      const isMobile = mount.clientWidth < 700
      const q = isMobile ? 1.55 : 1 // particle step multiplier (perf)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.05, 80)

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.1 : 1.35))
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      mount.appendChild(renderer.domElement)

      if (cancelled) { cleanup(); return }
      await frame()

      /* scrollGroup = scroll choreography (scaled up for presence);
         the machine stands perfectly upright — no tilt, just a slight
         drift-in from the right while the camera approaches */
      const SCALE = 1.25
      const scrollGroup = new THREE.Group()
      scrollGroup.scale.setScalar(SCALE)
      const parallax = new THREE.Group()
      // machine + keyboard + mouse + speaker span x ≈ -1.22…1.27; shift so the set sits centred
      parallax.position.x = -0.26
      scrollGroup.add(parallax)
      scene.add(scrollGroup)

    const FLOOR_LOCAL = -1.025 // machine bottom in local units

    /* ---- the machine, sampled into particles ---- */
    const acc: Acc = { pos: [], col: [] }
    // ink-toned shell — darker where shadowed, lighter toward the key
    // light (top / front), so the form reads on the white stage
    const shellShade = (x: number, y: number, z: number): [number, number, number] => {
      const lit = (y / 2.05 + 0.5) * 0.16 + (z > 0 ? 0.06 : -0.12) + (x > 0 ? 0.04 : 0)
      const v = Math.max(0.16, Math.min(0.6, 0.42 - lit + Math.random() * 0.1))
      return [v, v, v * 1.04]
    }
    const darkShade = (): [number, number, number] => {
      const v = 0.14 + Math.random() * 0.1
      return [v, v, v * 1.08]
    }
    // Klein-blue accent particles for the signature parts (keycaps, mouse, logo badge)
    const kleinShade = (): [number, number, number] => {
      const t = 0.6 + Math.random() * 0.35
      return [KLEIN.r * t, KLEIN.g * t, KLEIN.b * t]
    }
    // main body
    sampleBox(acc, 0, 0, 0, 1.5, 2.05, 1.6, 0.024 * q, shellShade)
    // bezel — charcoal frame around the screen, plus a recessed inner lip
    sampleBox(acc, 0, 0.42, 0.8, 1.18, 0.94, 0.05, 0.017 * q, darkShade)
    sampleBox(acc, 0, 0.42, 0.79, 1.06, 0.8, 0.03, 0.02 * q, darkShade)
    // floppy slot + eject button + brightness knob
    sampleBox(acc, 0.2, -0.34, 0.8, 0.62, 0.045, 0.03, 0.011 * q, () => [0.18, 0.18, 0.17])
    sampleBox(acc, 0.62, -0.34, 0.8, 0.09, 0.06, 0.03, 0.012 * q, darkShade)
    sampleBox(acc, -0.62, -0.34, 0.79, 0.06, 0.06, 0.04, 0.012 * q, darkShade)
    // badge + top vents + rear handle slot
    sampleBox(acc, -0.52, -0.4, 0.8, 0.15, 0.15, 0.02, 0.014 * q, kleinShade)
    for (let i = 0; i < 6; i++)
      sampleBox(acc, -0.45 + i * 0.18, 1.028, -0.1, 0.06, 0.014, 0.9, 0.018 * q, shellShade)
    sampleBox(acc, 0, 1.0, -0.62, 0.7, 0.06, 0.1, 0.016 * q, darkShade)
    // little feet
    sampleBox(acc, -0.55, FLOOR_LOCAL + 0.02, 0.55, 0.16, 0.05, 0.16, 0.02 * q, darkShade)
    sampleBox(acc, 0.55, FLOOR_LOCAL + 0.02, 0.55, 0.16, 0.05, 0.16, 0.02 * q, darkShade)
    sampleBox(acc, -0.55, FLOOR_LOCAL + 0.02, -0.55, 0.16, 0.05, 0.16, 0.02 * q, darkShade)
    sampleBox(acc, 0.55, FLOOR_LOCAL + 0.02, -0.55, 0.16, 0.05, 0.16, 0.02 * q, darkShade)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(acc.pos), 3))
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(acc.col), 3))
    geos.push(geo)
    const dotTex = makeDotTexture()
    texes.push(dotTex)
    const mat = new THREE.PointsMaterial({
      size: 0.021, vertexColors: true, transparent: true, map: dotTex, alphaTest: 0.05,
      opacity: 0, sizeAttenuation: true, depthWrite: false,
    })
    mats.push(mat)
    const machine = new THREE.Points(geo, mat)
    machine.renderOrder = 2
    parallax.add(machine)

    if (cancelled) { cleanup(); return }
    await frame()

    /* ---- retro mechanical keyboard: thick slab + tall keycaps ---- */
    const kbAcc: Acc = { pos: [], col: [] }
    const kbShade = (_x: number, y: number, z: number): [number, number, number] => {
      const lit = (z > 1.5 ? 0.05 : 0) + (y > -0.95 ? 0.08 : 0)
      const v = Math.max(0.18, Math.min(0.55, 0.4 - lit + Math.random() * 0.08))
      return [v, v, v * 1.04]
    }
    const KB_Z = 1.68
    const KB_H = 0.14
    const KB_TOP = FLOOR_LOCAL + KB_H
    sampleBox(kbAcc, 0, FLOOR_LOCAL + KB_H / 2, KB_Z, 1.48, KB_H, 0.56, 0.024 * q, kbShade)
    const KEY = 0.078, PITCH_X = 0.097, PITCH_Z = 0.093
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 14; c++) {
        const isSpace = r === 4 && c >= 4 && c <= 9
        if (r === 4 && c > 4 && c <= 9) continue // merged into the spacebar
        const isAccent = r === 0 && c === 0      // esc — Klein-blue keycap
        const w = isSpace ? PITCH_X * 6 - 0.02 : KEY
        sampleBox(
          kbAcc,
          -0.63 + c * PITCH_X + (isSpace ? (PITCH_X * 5) / 2 : 0),
          KB_TOP + 0.028,
          KB_Z - 0.2 + r * PITCH_Z,
          w, 0.056, KEY, 0.024 * q,
          isAccent
            ? () => { const t = 0.5 + Math.random() * 0.4; return [KLEIN.r * t, KLEIN.g * t, KLEIN.b * t] }
            : () => { const t = 0.45 + Math.random() * 0.4; return [KLEIN.r * t, KLEIN.g * t, KLEIN.b * t] },
        )
      }
    }
    // classic Apple-style mouse: a low rounded-ish puck beside the keyboard, one
    // button seam, same ink tone (it shares the keyboard's material and fade)
    const MOUSE_X = 1.12, MOUSE_Z = 1.5
    sampleBox(kbAcc, MOUSE_X, FLOOR_LOCAL + 0.05, MOUSE_Z, 0.3, 0.1, 0.44, 0.02 * q, kleinShade)
    sampleBox(kbAcc, MOUSE_X, FLOOR_LOCAL + 0.1, MOUSE_Z - 0.1, 0.24, 0.012, 0.012, 0.01 * q, () => [0.22, 0.22, 0.23])
    const kbGeo = new THREE.BufferGeometry()
    kbGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(kbAcc.pos), 3))
    kbGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(kbAcc.col), 3))
    geos.push(kbGeo)
    const kbMat = new THREE.PointsMaterial({
      size: 0.02, vertexColors: true, transparent: true, map: dotTex, alphaTest: 0.05,
      opacity: 0, sizeAttenuation: true, depthWrite: false,
    })
    mats.push(kbMat)
    const keyboard = new THREE.Points(kbGeo, kbMat)
    keyboard.renderOrder = 2
    parallax.add(keyboard)

    if (cancelled) { cleanup(); return }
    await frame()

    /* ---- Bose 901 Series V (1984, the Macintosh's own year): the studio
       icon standing left of the machine. Cabinet in the same ink tone as the
       shell; the signature front array of eight round drivers is the iconic
       part, so it carries the object's only Klein blue. Facing and base line
       match the keyboard and mouse (front toward the viewer).
       SPK_X keeps the desk rhythm even: speaker → machine → mouse gaps are
       all 0.22 (mouse side was already 0.22, so only the speaker moved). ---- */
    const spkAcc: Acc = { pos: [], col: [] }
    const SPK_X = -1.19, SPK_W = 0.44, SPK_H = 1.02, SPK_D = 0.36
    const SPK_CZ = 0.55                    // beside the machine, roughly flush with its front face
    const SPK_CY = FLOOR_LOCAL + SPK_H / 2
    sampleBox(spkAcc, SPK_X, SPK_CY, SPK_CZ, SPK_W, SPK_H, SPK_D, 0.024 * q, shellShade)
    // slightly darker base strip — the cabinet's plinth
    sampleBox(spkAcc, SPK_X, FLOOR_LOCAL + 0.035, SPK_CZ, SPK_W + 0.012, 0.07, SPK_D + 0.01, 0.02 * q, darkShade)
    // eight full-range drivers: two rows of four across the upper-middle front
    const DRV_R = 0.038, DRV_PITCH = 0.093, DRV_Z = SPK_CZ + SPK_D / 2 + 0.004
    for (let row = 0; row < 2; row++) {
      for (let c = 0; c < 4; c++) {
        const dx = SPK_X - 1.5 * DRV_PITCH + c * DRV_PITCH
        const dy = SPK_CY + 0.155 - row * 0.12
        for (let k = 0; k < 12; k++) {           // Klein-blue surround ring
          const a = (k / 12) * Math.PI * 2
          spkAcc.pos.push(dx + Math.cos(a) * DRV_R, dy + Math.sin(a) * DRV_R, DRV_Z)
          const t = 0.55 + Math.random() * 0.4
          spkAcc.col.push(KLEIN.r * t, KLEIN.g * t, KLEIN.b * t)
        }
        spkAcc.pos.push(dx, dy, DRV_Z + 0.001)   // near-white dust cap
        const dt = 0.75 + Math.random() * 0.2
        spkAcc.col.push(dt, dt, dt * 1.02)
      }
    }
    const spkGeo = new THREE.BufferGeometry()
    spkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(spkAcc.pos), 3))
    spkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(spkAcc.col), 3))
    geos.push(spkGeo)
    const spkMat = new THREE.PointsMaterial({
      size: 0.02, vertexColors: true, transparent: true, map: dotTex, alphaTest: 0.05,
      opacity: 0, sizeAttenuation: true, depthWrite: false,
    })
    mats.push(spkMat)
    const speaker = new THREE.Points(spkGeo, spkMat)
    speaker.renderOrder = 2
    parallax.add(speaker)

    if (cancelled) { cleanup(); return }
    await frame()

    // Klein-blue sparkle — a sparse ring framing the screen + stray glints
    const sparkAcc: Acc = { pos: [], col: [] }
    for (let i = 0; i < 90; i++) {
      const edge = Math.floor(Math.random() * 4)
      const u = Math.random()
      let x = 0, y = 0
      if (edge === 0) { x = -0.59 + u * 1.18; y = 0.42 + 0.47 }      // top
      else if (edge === 1) { x = -0.59 + u * 1.18; y = 0.42 - 0.47 } // bottom
      else if (edge === 2) { x = -0.59; y = 0.42 - 0.47 + u * 0.94 } // left
      else { x = 0.59; y = 0.42 - 0.47 + u * 0.94 }                  // right
      sparkAcc.pos.push(x, y, 0.83)
      const t = 0.55 + Math.random() * 0.45
      sparkAcc.col.push(KLEIN.r * t, KLEIN.g * t, Math.min(1, KLEIN.b * t + 0.1))
    }
    for (let i = 0; i < 40; i++) {
      sparkAcc.pos.push(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2.05,
        (Math.random() - 0.5) * 1.6,
      )
      const t = 0.35 + Math.random() * 0.4
      sparkAcc.col.push(KLEIN.r * t, KLEIN.g * t, KLEIN.b * t)
    }
    const sparkGeo = new THREE.BufferGeometry()
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sparkAcc.pos), 3))
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(sparkAcc.col), 3))
    geos.push(sparkGeo)
    const sparkMat = new THREE.PointsMaterial({
      size: 0.03, vertexColors: true, transparent: true, map: dotTex, alphaTest: 0.05,
      opacity: 0, sizeAttenuation: true, depthWrite: false,
    })
    mats.push(sparkMat)
    const sparks = new THREE.Points(sparkGeo, sparkMat)
    sparks.renderOrder = 2
    parallax.add(sparks)

    /* ---- the code wall: the falling rain (CodeRain's off-DOM canvas) is
       textured on a backdrop plane behind the gear. A depth prepass below
       writes the gear's silhouettes, and this plane is depth-tested against
       them, so the machines genuinely occlude the rain — while their own
       ghostly translucency is untouched, because the colour pass never sees
       that depth. ---- */
    let codeMat: THREE.MeshBasicMaterial | null = null
    let codeTex: THREE.CanvasTexture | null = null
    const rainCvs = rainCanvasRef.current
    if (rainCvs) {
      codeTex = new THREE.CanvasTexture(rainCvs)
      codeTex.colorSpace = THREE.SRGBColorSpace
      codeTex.generateMipmaps = false
      codeTex.minFilter = THREE.LinearFilter
      texes.push(codeTex)
      // alpha ramp: the streams dissolve before they reach the floor line
      const maskCvs = document.createElement('canvas')
      maskCvs.width = 4; maskCvs.height = 256
      const mctx = maskCvs.getContext('2d')!
      const mg = mctx.createLinearGradient(0, 0, 0, 256)
      mg.addColorStop(0, '#ffffff')
      mg.addColorStop(0.52, '#ffffff')
      mg.addColorStop(1, '#000000')
      mctx.fillStyle = mg
      mctx.fillRect(0, 0, 4, 256)
      const maskTex = new THREE.CanvasTexture(maskCvs)
      texes.push(maskTex)
      const codeGeo = new THREE.PlaneGeometry(18, 16)
      geos.push(codeGeo)
      codeMat = new THREE.MeshBasicMaterial({
        map: codeTex, alphaMap: maskTex, transparent: true, opacity: 0, depthWrite: false,
      })
      mats.push(codeMat)
      const codePlane = new THREE.Mesh(codeGeo, codeMat)
      codePlane.position.set(0, 0, -2.8)
      codePlane.layers.set(LAYER_CODE)
      scene.add(codePlane)
    }

    /* depth-only copies of the solid gear (machine, keyboard + mouse,
       speaker): they render invisibly, writing the silhouettes the code
       wall tests against. Sharing the geometries keeps them in lockstep
       with the scroll choreography for free. */
    const depthMat = new THREE.PointsMaterial({
      size: 0.021, map: dotTex, alphaTest: 0.05, colorWrite: false, depthWrite: true,
    })
    mats.push(depthMat)
    for (const g of [geo, kbGeo, spkGeo]) {
      const d = new THREE.Points(g, depthMat)
      d.layers.set(LAYER_DEPTH)
      parallax.add(d)
    }

    if (cancelled) { cleanup(); return }
    await frame()

    /* ---- the CRT screen (kept solid for readability + the dive) ---- */
    const screenCvs = document.createElement('canvas')
    screenCvs.width = 640; screenCvs.height = 480
    const drawDino = makeDinoScreen(screenCvs)
    drawDino(0)
    const screenTex = new THREE.CanvasTexture(screenCvs)
    screenTex.colorSpace = THREE.SRGBColorSpace
    screenTex.generateMipmaps = false
    screenTex.minFilter = THREE.LinearFilter
    texes.push(screenTex)
    const screenGeo = new THREE.PlaneGeometry(1.02, 0.765)
    geos.push(screenGeo)
    const screen = new THREE.Mesh(
      screenGeo,
      new THREE.MeshBasicMaterial({ map: screenTex, transparent: true }),
    )
    mats.push(screen.material as THREE.Material)
    screen.position.set(0, 0.42, 0.828)
    screen.renderOrder = 2
    parallax.add(screen)
    // black layer that eats the site, then becomes the tunnel wall
    const dimGeo = new THREE.PlaneGeometry(1.02, 0.765)
    geos.push(dimGeo)
    const dim = new THREE.Mesh(
      dimGeo,
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }),
    )
    mats.push(dim.material as THREE.Material)
    dim.position.set(0, 0.42, 0.831)
    dim.renderOrder = 2
    parallax.add(dim)

    if (cancelled) { cleanup(); return }
    await frame()

    /* ---- desk contact shadows: one projected shadow per device, from the
       real footprint of each box along the light direction (no blobs).
       They stack with normal alpha blending, so overlaps darken naturally.
       Each one is rasterised on its own frame — the blurred canvas fills are
       the heaviest step in the build. ---- */
    const mkShadow = (cx: number, cz: number, w: number, h: number, d: number, alpha: number) => {
      const s = makeBoxShadow(cx, cz, w, h, d, FLOOR_LOCAL, alpha)
      texes.push(s.texture)
      const m = new THREE.MeshBasicMaterial({ map: s.texture, transparent: true, opacity: 0, depthWrite: false })
      mats.push(m)
      const plane = new THREE.PlaneGeometry(s.width, s.height)
      geos.push(plane)
      const mesh = new THREE.Mesh(plane, m)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(s.centerX, FLOOR_LOCAL + 0.004, s.centerZ)
      mesh.renderOrder = 1
      scrollGroup.add(mesh)
      return m
    }
    const shadowMat = mkShadow(0, 0, 1.5, 2.05, 1.6, 0.16)                    // machine
    if (cancelled) { cleanup(); return }
    await frame()
    const kbShadowMat = mkShadow(0, KB_Z, 1.48, KB_H, 0.56, 0.135)           // keyboard
    if (cancelled) { cleanup(); return }
    await frame()
    const mouseShadowMat = mkShadow(MOUSE_X, MOUSE_Z, 0.3, 0.1, 0.44, 0.145) // mouse
    if (cancelled) { cleanup(); return }
    await frame()
    const spkShadowMat = mkShadow(SPK_X, SPK_CZ, SPK_W, SPK_H, SPK_D, 0.155) // speaker

    if (cancelled) { cleanup(); return }
    await frame()

    /* the darkness beyond the screen — only fades in as the dive begins,
       so the stage stays paper-white until the camera enters the panel */
    const beyondGeo = new THREE.PlaneGeometry(60, 40)
    geos.push(beyondGeo)
    const beyond = new THREE.Mesh(
      beyondGeo,
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 }),
    )
    mats.push(beyond.material as THREE.Material)
    beyond.position.set(0, 0, -4)
    scene.add(beyond)

    const smooth01 = (a: number, b: number, v: number) => {
      const t = Math.max(0, Math.min(1, (v - a) / (b - a)))
      return t * t * (3 - 2 * t)
    }

    // the screen's centre in world space: the parallax offset is applied to the whole machine,
    // so the dive has to aim at this x rather than at 0 (otherwise the screen sits left of centre)
    const SCREEN_X = parallax.position.x * SCALE
    const SCREEN_Z = 0.828 * SCALE
    const SCREEN_Y = 0.42 * SCALE
    /* narrow (portrait) viewports see less width — pull the camera back
       so the whole machine stays in frame */
    let boost = 1
    const updateBoost = () => {
      boost = Math.max(1, Math.min(2.05, 1.3 / camera.aspect))
    }
    updateBoost()
    const _look = new THREE.Vector3()
    let intro = 0
    // the camera follows a smoothed copy of the scroll progress, so every wheel tick
    // becomes a continuous glide instead of a step (no extra re-renders, just rAF)
    let shownP = progress.current
    let panShown = 0
    let lastRainFrame = ''
    let dinoAcc = 0
    const clock = new THREE.Clock()
    const tick = () => {
      raf = 0
      if (!onScreen || loadingMotionPaused()) return
      const dt = Math.min(clock.getDelta(), 0.05)
      intro = Math.min(1, intro + dt * 0.8)
      shownP += (progress.current - shownP) * (1 - Math.exp(-dt * 12))
      if (Math.abs(progress.current - shownP) < 1e-6) shownP = progress.current
      const p = shownP
      const approach = smooth01(0, 0.46, p)     // dolly toward the machine
      const dive = smooth01(0.52, 0.93, p)      // through the screen
      const gone = smooth01(0.48, 0.68, p)      // shell is gone before the camera crosses the glass

      // camera: high and looking down → descends to a level front view →
      // through the screen → beyond
      // pulled a little further back so the wider trio stays inside the frame
      const zFar = 10.4 * boost
      const zNear = 3.65 * boost
      const zThrough = SCREEN_Z - 1.25          // fully past the panel
      camera.position.z = zNear + (zThrough - zNear) * dive + (zFar - zNear) * (1 - approach) * (1 - dive)
      camera.position.y = (2.5 * (0.6 + 0.4 * boost) - approach * 2.4 * (0.6 + 0.4 * boost)) * (1 - dive) + SCREEN_Y * dive
      // pan camera and look target together onto the screen centre before the dive starts,
      // so the straight push-in always aims at the middle of the screen
      // a long window (0.10–0.52) keeps the sideways speed per scroll tick small, and a
      // second damper removes trackpad jitter, so the lateral move can't wobble left/right
      panShown += (smooth01(0.1, 0.52, p) - panShown) * (1 - Math.exp(-dt * 8))
      const pan = panShown
      camera.position.x = SCREEN_X * pan
      // the view target locks onto the screen centre early and then stays put, so the screen
      // itself never drifts sideways in frame: only the camera travels across
      const lookPan = smooth01(0.1, 0.3, p)
      _look.set(SCREEN_X * lookPan, 0.05 * (1 - dive) + SCREEN_Y * dive, -4 * dive)
      camera.lookAt(_look)

      // gently side-on at first, squaring up to the front as we descend
      scrollGroup.position.x = 0.15 * (1 - approach) * (1 - dive)
      scrollGroup.rotation.y = 0.18 * (1 - approach) * (1 - dive)

      // particle shell: intro fade-in, then dissolve as we enter the screen
      const shellA = intro * (1 - gone)
      mat.opacity = shellA * 0.95
      kbMat.opacity = shellA * 0.95
      spkMat.opacity = shellA * 0.95
      sparkMat.opacity = shellA * (0.6 + Math.sin(clock.elapsedTime * 2.2) * 0.25)

      // contact shadows ride with the gear
      shadowMat.opacity = intro * (1 - gone)
      kbShadowMat.opacity = intro * (1 - gone)
      mouseShadowMat.opacity = intro * (1 - gone)
      spkShadowMat.opacity = intro * (1 - gone)

      // the camera crosses the glass around p 0.80. The panel, the space
      // behind it, and the canvas clear must already be opaque black by then,
      // or the white page shows through and the shell is still in frame.
      ;(dim.material as THREE.MeshBasicMaterial).opacity = smooth01(0.50, 0.68, p)
      ;(beyond.material as THREE.MeshBasicMaterial).opacity = smooth01(0.56, 0.74, p)
      renderer.setClearColor(0x000000, smooth01(0.56, 0.74, p))

      // the little runner keeps running (throttled texture upload)
      dinoAcc += dt
      if (dinoAcc > 1 / 30) {
        drawDino(dinoAcc)
        dinoAcc = 0
        screenTex.needsUpdate = true
      }

      // the rain fades with the dive — gone well before the screen floods black
      let codeOn = false
      if (codeMat) {
        codeMat.opacity = intro * (1 - Math.min(1, Math.max(0, (p - 0.38) / 0.2)))
        codeOn = codeMat.opacity > 0.01
        // upload every frame the canvas is drawn: a slower texture beat than
        // the simulation is what makes the rain read as choppy
        if (codeOn && codeTex) { const version = rainCvs?.dataset.frame ?? ''; if (version !== lastRainFrame) { codeTex.needsUpdate = true; lastRainFrame = version } }
      }

      /* Three passes share one frame: (1) the gear's depth silhouettes render
         invisibly; (2) the code wall draws, depth-tested against them, so the
         machines occlude the rain; (3) the depth buffer is dropped and the
         scene itself renders, leaving the gear's translucency untouched. */
      renderer.autoClear = false
      renderer.clear()
      if (codeOn) {
        camera.layers.set(LAYER_DEPTH)
        renderer.render(scene, camera)
        camera.layers.set(LAYER_CODE)
        renderer.render(scene, camera)
        renderer.clearDepth()
      }
      camera.layers.set(0)
      renderer.render(scene, camera)
      renderer.autoClear = true
      wake()
    }
    // hoisted: the interrupted-build cleanup above references these
    // before their definitions run
    function wake() { if (!raf && onScreen && !loadingMotionPaused()) raf = requestAnimationFrame(tick) }
    function onResize() {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      updateBoost()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }

    /* Warm the shader programs NOW, while the veil is still up: the first
       real render after the transition then costs one frame instead of a
       visible stall at the page reveal (compileAsync keeps the compile off
       the main thread wherever KHR_parallel_shader_compile exists). */
    const warmCamera = camera.clone()
    warmCamera.layers.enableAll()
    await renderer.compileAsync(scene, warmCamera).catch(() => { /* graceful fallback */ })
    if (cancelled) { cleanup(); return }
    delete mount.dataset.scenePending

    // the Mac stage is a second WebGL scene: park it while it is off screen
    addEventListener('portfolio-loading-motion', wake)
    io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) wake()
    })
    io.observe(mount)
    wake()
    addEventListener('resize', onResize)

    teardown = cleanup

    // hoisted: also runs from the checkpoints when a build is interrupted
    function cleanup() {
      cancelAnimationFrame(raf)
      io?.disconnect()
      removeEventListener('portfolio-loading-motion', wake)
      removeEventListener('resize', onResize)
      delete mount.dataset.scenePending
      renderer.dispose()
      for (const t of texes) t.dispose()
      for (const g of geos) g.dispose()
      for (const m of mats) m.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
    }

    void build(mount)

    return () => {
      cancelled = true
      teardown?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={mountRef} className="ec-mac" aria-hidden />
}
