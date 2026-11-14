// Helpers for building the single Mockoon environment. Source of truth stays docs/<module>/ (contract)
// and frontend/src/mocks/ (TS mock); this folder is the runnable-over-HTTP counterpart.
import { createHash } from 'node:crypto'

// Deterministic GUIDs so regenerating doesn't churn the output file.
export const guid = (seed) => {
	const h = createHash('md5').update(seed).digest('hex')
	return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

// Seed arrays -> object keyed by id, so Mockoon's setData can address a row by path ("3.name").
export const byId = (rows) => Object.fromEntries(rows.map((r) => [String(r.id), r]))

// Mockoon response rule that fires when the template renders 'true' (the only way to branch on data state).
export const when = (template) => ({ target: 'templating', modifier: template, value: 'true', operator: 'equals', invert: false })

export const resp = (seed, { status = 200, body, label, rules = [], isDefault = false }) => ({
	uuid: guid(seed),
	body,
	latency: 0,
	statusCode: status,
	label,
	headers: [{ key: 'Content-Type', value: 'application/json' }],
	bodyType: 'INLINE',
	filePath: '',
	databucketID: '',
	sendFileAsBody: false,
	rules,
	rulesOperator: 'AND',
	disableTemplating: false,
	fallbackTo404: false,
	default: isDefault,
	crudKey: 'id',
	callbacks: []
})

export const route = (method, endpoint, documentation, responses) => ({
	uuid: guid(`${method} ${endpoint}`),
	type: 'http',
	documentation,
	method,
	endpoint,
	responses,
	responseMode: null,
	streamingMode: null,
	streamingInterval: 0
})

// Handlebars subexpression: JMESPath over a data bucket; parts starting with "(" are subexpressions, others literals.
export const jp = (bucket, ...parts) =>
	`(jmesPath (dataRaw '${bucket}') (concat ${parts.map((p) => (p.startsWith('(') ? p : `'${p}'`)).join(' ')}))`

// The active company, from the X-Company-Id request header (see docs/conventions.md#company-scoping).
export const CID = "(header 'X-Company-Id')"
export const hasCompany = `{{#if (parseInt ${CID})}}true{{else}}false{{/if}}`

// `q` filter over the given fields, appended inside a JMESPath [? ... ] filter. The TS mock is case-insensitive but
// JMESPath has no lower(), so try q as typed / lower / UPPER / Capitalized (approximate).
const Q = "(queryParam 'q' '')"
const LOW = `(lowercase ${Q})`
const qVariants = [Q, LOW, `(uppercase ${Q})`, `(concat (uppercase (substr ${LOW} 0 1)) (substr ${LOW} 1))`]
export const search = (...fields) => [
	' && (',
	...qVariants.flatMap((q, i) => fields.flatMap((f, j) => [`${i || j ? ' || ' : ''}contains(${f}, \`"`, q, '"`)'])),
	')'
]

// Paginated list body: {data, meta} per docs/conventions.md. `rows` is a Handlebars subexpression returning the full filtered array.
export const listBody = (rows) => `{{~setVar 'rows' ${rows}~}}
{{~setVar 'page' (parseInt (queryParam 'page' '1'))~}}
{{~setVar 'pp' (parseInt (queryParam 'per_page' '10'))~}}
{{~setVar 'from' (multiply (subtract (getVar 'page') 1) (getVar 'pp'))~}}
{"data": {{{stringify (slice (getVar 'rows') (getVar 'from') (add (getVar 'from') (getVar 'pp')))}}},
"meta": {"page": {{getVar 'page'}}, "per_page": {{getVar 'pp'}}, "total": {{len (getVar 'rows')}}, "last_page": {{#if (len (getVar 'rows'))}}{{ceil (divide (len (getVar 'rows')) (getVar 'pp'))}}{{else}}1{{/if}} }}`

export const json = (o) => JSON.stringify(o)
