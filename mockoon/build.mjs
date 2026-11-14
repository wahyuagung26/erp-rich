// Builds mockoon/erp-v2.mockoon.json — ONE Mockoon environment for every module (shared data buckets, one port).
// Usage: node mockoon/build.mjs   (generated file; edit modules/*.mjs, never the JSON)
import { writeFileSync } from 'node:fs'
import { guid } from './lib.mjs'

const modules = ['unit'] // add a module = new modules/<name>.mjs + one entry here
const routes = []
const data = []
const folders = []
for (const name of modules) {
	const m = await import(`./modules/${name}.mjs`)
	const folderId = guid(`folder:${name}`)
	folders.push({ uuid: folderId, name, children: m.routes.map((r) => ({ type: 'route', uuid: r.uuid })) })
	routes.push(...m.routes)
	for (const [bucket, rows] of Object.entries(m.data))
		data.push({ uuid: guid(`bucket:${bucket}`), id: bucket, name: bucket, documentation: '', value: JSON.stringify(rows) })
}

const env = {
	uuid: guid('erp-v2'),
	lastMigration: 32,
	name: 'ERP Finance v2 mock',
	endpointPrefix: '',
	latency: 0,
	port: 3100,
	hostname: '0.0.0.0',
	routes,
	folders,
	rootChildren: folders.map((f) => ({ type: 'folder', uuid: f.uuid })),
	proxyMode: false,
	proxyHost: '',
	proxyRemovePrefix: false,
	tlsOptions: { enabled: false, type: 'CERT', pfxPath: '', certPath: '', keyPath: '', caPath: '', passphrase: '' },
	cors: true,
	headers: [
		{ key: 'Content-Type', value: 'application/json' },
		{ key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Company-Id' }
	],
	proxyReqHeaders: [{ key: '', value: '' }],
	proxyResHeaders: [{ key: '', value: '' }],
	data,
	callbacks: []
}
writeFileSync(new URL('./erp-v2.mockoon.json', import.meta.url), JSON.stringify(env, null, '\t') + '\n')
console.log(`erp-v2.mockoon.json: ${modules.length} module(s), ${routes.length} route(s), ${data.length} bucket(s)`)
