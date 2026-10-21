// One-off CDP screenshot: About page Mac scene (the sticky stage inside the
// 300vh .ec-track, which starts at the top of the document — NOT the bottom).
// Uses Edge headless + Node 22's built-in WebSocket. No dependencies.
const { execFile } = require('child_process')
const fs = require('fs')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9355
const URL = 'http://localhost:3000/#/about'
const OUT_A = process.argv[2] || 'Q:/portfolio-react-site/review/mac-scene-check.png'
const OUT_B = process.argv[3] || 'Q:/portfolio-react-site/review/mac-scene-approach.png'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const child = execFile(EDGE, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + require('os').tmpdir() + '/cdp-shot-profile',
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

  // entry preloader (chunk + fonts) first, then the sticky Mac stage fades in
  await sleep(7000)
  const at = await evaluate('window.scrollTo(0, 0); Math.round(document.querySelector(".ec-track")?.getBoundingClientRect().top || -1)')
  console.log('track top:', at)
  await sleep(5000) // intro fade-in (1.25s) + settle

  const shot = async (out) => {
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    if (!s?.result?.data) { console.error('NO_SHOT_DATA'); process.exit(1) }
    fs.mkdirSync(require('path').dirname(out), { recursive: true })
    fs.writeFileSync(out, Buffer.from(s.result.data, 'base64'))
    console.log('SAVED ' + out)
  }
  await shot(OUT_A)

  // dolly in a little (p ≈ 0.25 of the track): camera lower, machine squarer
  await evaluate('window.scrollTo(0, 600)')
  await sleep(2500)
  await shot(OUT_B)

  sock.close()
  process.exit(0)
}
main().catch(e => { console.error('FAIL', e.message); process.exit(1) })
