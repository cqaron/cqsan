// Capture the About route veil mid-transition (the line-drawing phase).
// Home → click About → screenshot at a fixed delay.
const { execFile } = require('child_process')
const fs = require('fs')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9356
const URL = 'http://localhost:3000/'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

async function main() {
  const child = execFile(EDGE, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + require('os').tmpdir() + '/cdp-veil-profile',
    '--window-size=1440,900', '--force-device-scale-factor=1',
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    URL,
  ], () => {})
  child.unref()

  let ws = null
  for (let i = 0; i < 40 && !ws; i++) {
    await sleep(300)
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
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

  await sleep(7000) // entry preloader
  const shot = async (out) => {
    const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    if (!s?.result?.data) { console.error('NO_SHOT_DATA'); process.exit(1) }
    fs.mkdirSync(require('path').dirname(out), { recursive: true })
    fs.writeFileSync(out, Buffer.from(s.result.data, 'base64'))
    console.log('SAVED ' + out)
  }

  // mid-draw: lines ~40-60% travelled
  await evaluate(`document.querySelector('a[href="#/about"]').click()`)
  await sleep(1100)
  await shot('Q:/portfolio-react-site/review/veil-mid-draw.png')

  // lifting: veil fading, lines retracting + defocus
  await sleep(900)
  await shot('Q:/portfolio-react-site/review/veil-lift.png')

  sock.close()
  process.exit(0)
}
main().catch(e => { console.error('FAIL', e.message); process.exit(1) })
