// `npm run prototype`: the frontend (vite) + the mock server (scripts/mock-server.mjs) in one terminal.
// It sets VITE_USE_MOCK/VITE_APP_API_URL itself, so .env does not need editing; Ctrl-C stops both.
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const port = process.env.MOCK_PORT || '3100'
const env = { ...process.env, MOCK_PORT: port, VITE_USE_MOCK: 'false', VITE_APP_API_URL: `http://localhost:${port}` }
const bin = (p) => fileURLToPath(new URL(p, import.meta.url))

const kids = [
	spawn(process.execPath, [bin('./mock-server.mjs')], { stdio: 'inherit', env }),
	spawn(bin('../node_modules/.bin/vite'), { stdio: 'inherit', env })
]
const stop = (code = 0) => {
	kids.forEach((k) => k.kill())
	process.exit(code)
}
kids.forEach((k) => k.on('exit', (code) => stop(code ?? 0)))
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
