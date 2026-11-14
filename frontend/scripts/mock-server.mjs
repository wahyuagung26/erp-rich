// Serves the existing TS mock (src/mocks) over real HTTP so a backend can be built/compared against the same behaviour.
// Same handlers, fixtures and in-memory state as `VITE_USE_MOCK=true`; state resets on restart.
//   node scripts/mock-server.mjs            (port 3100, or MOCK_PORT=...)
// Normally started together with the frontend by `npm run prototype` (scripts/prototype.mjs).
import { createServer as createHttp } from 'node:http'
import { fileURLToPath } from 'node:url'
import { createServer as createVite } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const port = Number(process.env.MOCK_PORT) || 3100

// Mocks read the logged-in user's name from localStorage for history entries; there is no browser here, so they fall back to 'Admin'.
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = { getItem: () => null }

const vite = await createVite({
	root,
	configFile: false,
	logLevel: 'error',
	appType: 'custom',
	server: { middlewareMode: true, hmr: false, watch: null },
	optimizeDeps: { noDiscovery: true },
	resolve: {
		alias: [
			{ find: '@/utils/api', replacement: fileURLToPath(new URL('./mock-server-api.mjs', import.meta.url)) },
			{ find: '@', replacement: fileURLToPath(new URL('../src', import.meta.url)) }
		]
	}
})
const { startMock } = await vite.ssrLoadModule('/src/mocks/index.ts')
startMock()
const api = globalThis.__mockApi

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Company-Id'
}
const readBody = async (req) => {
	const chunks = []
	for await (const c of req) chunks.push(c)
	return Buffer.concat(chunks).toString()
}

createHttp(async (req, res) => {
	if (req.method === 'OPTIONS') return res.writeHead(204, CORS).end()
	try {
		const url = new URL(req.url, 'http://mock')
		const params = {}
		for (const [k, v] of url.searchParams) params[k] = k in params ? [].concat(params[k], v) : v
		const raw = await readBody(req)
		let data
		try {
			data = raw ? JSON.parse(raw) : undefined
		} catch {
			data = raw
		}
		// Handlers read headers with their canonical casing (config.headers['X-Company-Id']); Node lowercases them.
		const headers = { 'X-Company-Id': req.headers['x-company-id'], Authorization: req.headers.authorization }
		const r = await api.request({ method: req.method, url: url.pathname, params, data, headers })
		console.log(`${req.method} ${req.url} -> ${r.status}`)
		res.writeHead(r.status, { ...CORS, 'Content-Type': 'application/json' }).end(r.data === undefined ? '' : JSON.stringify(r.data))
	} catch (e) {
		console.error(`${req.method} ${req.url} -> 500`, e)
		res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' }).end(JSON.stringify({ message: String(e?.message ?? e) }))
	}
}).listen(port, () => console.log(`TS mock over HTTP: http://localhost:${port}`))

process.on('SIGINT', () => vite.close().then(() => process.exit(0)))
