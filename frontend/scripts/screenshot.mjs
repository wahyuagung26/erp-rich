// Render routes of the running dev server to PNGs + collect console errors.
// Zero-install: drives system Chrome over CDP with Node's built-in WebSocket.
// (playwright/puppeteer are NOT deps here — see .claude/skills/frontend SKILL.md §5.)
//
//   npm run dev                       # in another terminal
//   node scripts/screenshot.mjs /journal /journal/tambah /journal/1
//
// Env: BASE_URL (default http://localhost:5173), OUT_DIR (default ./.screenshots),
//      CHROME (default macOS Google Chrome), PORT (CDP port, default 9222).
// Auth: seeds localStorage token + an admin user, so auth-gated routes just work.

import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const OUT_DIR = process.env.OUT_DIR || join(process.cwd(), '.screenshots')
const PORT = Number(process.env.PORT || 9222)
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const USER = { id: 1, name: 'Sri Wahyuni', email: 'admin@rahadhyan.co.id', roles: [{ name: 'admin' }] }

const routes = process.argv.slice(2)
if (!routes.length) {
	console.error('usage: node scripts/screenshot.mjs <route> [route...]')
	process.exit(1)
}
mkdirSync(OUT_DIR, { recursive: true })

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const chrome = spawn(CHROME, [
	'--headless=new',
	`--remote-debugging-port=${PORT}`,
	`--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp-'))}`,
	'--window-size=1400,1600',
	'--hide-scrollbars',
	'about:blank'
])
process.on('exit', () => chrome.kill())

await wait(1500)
const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json()
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)

let id = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', (e) => {
	const m = JSON.parse(e.data)
	if (m.id && pending.has(m.id)) pending.get(m.id)(m.result)
	if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
		errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
	if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
})
await new Promise((r) => (ws.onopen = r))
const send = (method, params = {}) => new Promise((res) => (pending.set(++id, res), ws.send(JSON.stringify({ id, method, params }))))

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: `${BASE_URL}/login` })
await wait(2000)
await send('Runtime.evaluate', {
	expression: `localStorage.setItem('token','dev.screenshot');localStorage.setItem('user',${JSON.stringify(JSON.stringify(USER))})`
})

for (const route of routes) {
	const before = errors.length
	await send('Page.navigate', { url: BASE_URL + route })
	await wait(2500)
	const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
	const file = join(OUT_DIR, (route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root') + '.png')
	writeFileSync(file, Buffer.from(data, 'base64'))
	console.log(`${route}  ->  ${file}${errors.length > before ? `  ⚠ ${errors.length - before} console error(s)` : ''}`)
}

if (errors.length) {
	console.log('\nconsole errors:')
	for (const e of errors) console.log('  ' + e.split('\n')[0])
}
ws.close()
chrome.kill()
process.exit(errors.length ? 1 : 0)
