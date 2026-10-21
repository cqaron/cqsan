/// <reference lib="webworker" />
/**
 * Off-main-thread builder for the hero globe's point data. Fetching, topojson
 * parsing, rasterising and sampling all run here, so the page's 0-100 counter
 * keeps its frame rate. Results come back as transferable Float32Arrays.
 */
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'

const W = 960
const H = 480

async function buildLand(radius: number) {
  const res = await fetch('/assets/land-110m.json')
  const topo = (await res.json()) as Topology
  const land = feature(topo, topo.objects.land as GeometryCollection) as unknown as {
    features: Array<{ geometry: { type: string; coordinates: number[][][] | number[][][][] } }>
  }

  const cvs = new OffscreenCanvas(W, H)
  const ctx = cvs.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#fff'

  const project = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ]
  const drawRing = (ring: number[][]) => {
    ring.forEach(([lon, lat], i) => {
      const [x, y] = project(lon, lat)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
  }
  for (const f of land.features) {
    const g = f.geometry
    ctx.beginPath()
    if (g.type === 'Polygon') {
      for (const ring of g.coordinates as number[][][]) drawRing(ring)
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates as number[][][][])
        for (const ring of poly) drawRing(ring)
    }
    ctx.fill()
  }

  const img = ctx.getImageData(0, 0, W, H).data
  const main: number[] = []
  const accent: number[] = []
  const STEP = 3
  for (let y = 0; y < H; y += STEP) {
    for (let x = 0; x < W; x += STEP) {
      if (img[(y * W + x) * 4] < 128) continue
      if (Math.random() > 0.84) continue
      const lat = 90 - ((y + Math.random() * STEP) / H) * 180
      const lon = ((x + Math.random() * STEP) / W) * 360 - 180
      const phi = ((90 - lat) * Math.PI) / 180
      const theta = ((lon + 180) * Math.PI) / 180
      const px = -radius * Math.sin(phi) * Math.cos(theta)
      const py = radius * Math.cos(phi)
      const pz = radius * Math.sin(phi) * Math.sin(theta)
      const isAccent = Math.random() < 0.028 || (lat > 25 && lat < 55 && lon > 70 && lon < 125 && Math.random() < 0.10)
      if (isAccent) accent.push(px, py, pz)
      else main.push(px, py, pz)
    }
  }
  return {
    positions: new Float32Array(main),
    accentPositions: new Float32Array(accent),
  }
}

async function buildBorders(radius: number) {
  const res = await fetch('/assets/countries-110m.json')
  const topo = (await res.json()) as Topology
  const borders = mesh(topo, topo.objects.countries as GeometryCollection, (a, b) => a !== b) as unknown as {
    coordinates: number[][][]
  }

  const cvs = new OffscreenCanvas(W, H)
  const ctx = cvs.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (const line of borders.coordinates) {
    line.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * W
      const y = ((90 - lat) / 180) * H
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
  }
  ctx.stroke()

  const img = ctx.getImageData(0, 0, W, H).data
  const out: number[] = []
  const STEP = 2
  for (let y = 0; y < H; y += STEP) {
    for (let x = 0; x < W; x += STEP) {
      if (img[(y * W + x) * 4] < 128) continue
      if (Math.random() > 0.7) continue
      const lat = 90 - ((y + Math.random() * STEP) / H) * 180
      const lon = ((x + Math.random() * STEP) / W) * 360 - 180
      const phi = ((90 - lat) * Math.PI) / 180
      const theta = ((lon + 180) * Math.PI) / 180
      out.push(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      )
    }
  }
  return new Float32Array(out)
}

self.onmessage = async (e: MessageEvent<{ radius: number }>) => {
  const R = e.data.radius
  const [land, borderPos] = await Promise.all([buildLand(R), buildBorders(R)])
  self.postMessage(
    { positions: land.positions, accentPositions: land.accentPositions, borderPos },
    [land.positions.buffer, land.accentPositions.buffer, borderPos.buffer] as unknown as Transferable[],
  )
}
