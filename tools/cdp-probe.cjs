// One-off frame-timing probe: measures rAF frame deltas while the About
// route transition plays, so the veil stutter can be located in time.
// Edge headless + Node 22 built-in WebSocket. No dependencies.
const { execFile } = require('child_process')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = Number(process.argv[2] || 9334)
const URL = 'http://localhost:3000/'
// optional CSS override injected just before the click (A/B testing)
const CSS_OVERRIDE = process.argv[3] || ''

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const child = execFile(EDGE, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + require('os').tmpdir() + '/cdp-probe-profile',
    '--window-size=1440,900', '--force-device-scale-factor=1',
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    URL,
  ], (err) => { if (err) console.error('LAUNCH_ERR', err.message) })
  child.unref()

  let ws = null
  for (let i = 0; i < 40 && !ws; i++) {
    await sleep(300)
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const tabs = await r.json()
      const page = tabs.find(t => t.type === 'page')
      if (page?.webSocketDebuggerUrl) ws = page.webSocketDebuggerUrl
    } catch {}
  }
  if (!ws) { console.error('NO_DEBUG_ENDPOINT'); process.exit(1) }

  const sock = new WebSocket(ws)
  await new Promise((res, rej) => { sock.onopen = res; sock.onerror = rej })

  let id = 0
  const pending = new Map()
  sock.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  }
  const send = (method, params = {}) => new Promise((res) => {
    const mid = ++id
    pending.set(mid, res)
    sock.send(JSON.stringify({ id: mid, method, params }))
  })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
    return r?.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')

  // wait for the entry preloader to be gone (home settled)
  await sleep(7000)

  // install the recorder: sample every rAF, keep deltas, expose a reader
  await evaluate(`
    window.__frames = []
    window.__recOn = false
    window.__recStart = 0
    let last = performance.now()
    const loop = () => {
      const now = performance.now()
      const dt = now - last
      last = now
      if (window.__recOn) window.__frames.push([Math.round(now - window.__recStart), Math.round(dt * 10) / 10])
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
    'ok'
  `)

  // start recording and click the About link in the same tick
  const clicked = await evaluate(`
    (() => {
      const a = document.querySelector('a[href="#/about"]')
      if (!a) return 'no-link'
      ${CSS_OVERRIDE ? `const st = document.createElement('style'); st.textContent = ${JSON.stringify(CSS_OVERRIDE)}; document.head.appendChild(st)` : ''}
      // hover first so the route prefetch fires (mirrors a real user)
      a.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }))
      window.__recOn = true
      window.__recStart = performance.now()
      a.click()
      return 'clicked'
    })()
  `)
  console.log('click:', clicked)

  await sleep(5000)

  const frames = await evaluate('JSON.stringify(window.__frames)')
  const arr = JSON.parse(frames || '[]')
  if (!arr.length) { console.error('NO_FRAMES'); process.exit(1) }

  const marks = await evaluate(`JSON.stringify(performance.getEntriesByType('mark').map(m => [m.name, Math.round(m.startTime - window.__recStart)]))`)
  console.log('marks (ms from click):', marks)

  // stats: bucket into 200ms windows
  const buckets = new Map()
  let longFrames = []
  let total = 0
  for (const [t, dt] of arr) {
    total += dt
    const b = Math.floor(t / 200) * 200
    if (!buckets.has(b)) buckets.set(b, { n: 0, sum: 0, max: 0 })
    const bk = buckets.get(b)
    bk.n++; bk.sum += dt; bk.max = Math.max(bk.max, dt)
    if (dt > 34) longFrames.push([t, dt])
  }
  const span = arr[arr.length - 1][0]
  console.log(`frames=${arr.length} span=${span}ms avgFps=${(arr.length / (span / 1000)).toFixed(1)}`)
  console.log('window(ms)  n   avg(ms)  max(ms)')
  for (const [b, v] of [...buckets.entries()].sort((a, c) => a[0] - c[0])) {
    console.log(`${String(b).padStart(6)}  ${String(v.n).padStart(3)}  ${(v.sum / v.n).toFixed(1).padStart(6)}  ${v.max.toFixed(1).padStart(6)}`)
  }
  console.log('long frames (>34ms): t(ms from click) -> dt(ms)')
  console.log(longFrames.map(([t, d]) => `${t} -> ${d}`).join('\n'))

  sock.close()
  process.exit(0)
}
main().catch(e => { console.error('FAIL', e.message); process.exit(1) })
