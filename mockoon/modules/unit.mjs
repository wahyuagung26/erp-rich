// Contract: docs/unit/. Mirrors frontend/src/mocks/modules/unit.ts.
// Deviations from the TS mock: new rows are appended (the bucket is an id-keyed object, so list order is by id),
// `q` is only approximately case-insensitive (see `search`), `code` is not trimmed on create.
import { byId, jp, CID, when, resp, route } from '../lib.mjs'
import { unitSeed } from '../../frontend/src/mocks/fixtures/unit.ts'

const B = 'unit'
const live = (...extra) => jp(B, 'values(@)[?company_id==`', CID, '` && deleted_at==null', ...extra, ']')
const one = jp(B, 'values(@)[?id==`', "(urlParam 'id')", '` && company_id==`', CID, '` && deleted_at==null] | [0]')
const noCompany = `{{#if (parseInt ${CID})}}false{{else}}true{{/if}}`
const missing = `{{#if (parseInt ${CID})}}{{#if ${one}}}false{{else}}true{{/if}}{{else}}true{{/if}}`
const json = (o) => JSON.stringify(o)

// q matches code + name. The mock is case-insensitive but JMESPath has no lower(), so try q as typed / lower / UPPER / Capitalized.
const qs = ["(queryParam 'q' '')", "(lowercase (queryParam 'q' ''))", "(uppercase (queryParam 'q' ''))", "(concat (uppercase (substr (lowercase (queryParam 'q' '')) 0 1)) (substr (lowercase (queryParam 'q' '')) 1))"]
const search = [' && (', ...qs.flatMap((q, i) => [`${i ? ' || ' : ''}contains(code, \`"`, q, '"`) || contains(name, `"', q, '"`)']), ')']

const list = (rows) => `{{~setVar 'rows' ${rows}~}}
{{~setVar 'page' (parseInt (queryParam 'page' '1'))~}}
{{~setVar 'pp' (parseInt (queryParam 'per_page' '10'))~}}
{{~setVar 'from' (multiply (subtract (getVar 'page') 1) (getVar 'pp'))~}}
{"data": {{{stringify (slice (getVar 'rows') (getVar 'from') (add (getVar 'from') (getVar 'pp')))}}},
"meta": {"page": {{getVar 'page'}}, "per_page": {{getVar 'pp'}}, "total": {{len (getVar 'rows')}}, "last_page": {{#if (len (getVar 'rows'))}}{{ceil (divide (len (getVar 'rows')) (getVar 'pp'))}}{{else}}1{{/if}} }}`

// Code is unique per company, case-insensitive. Renders 'true' once per clash.
const taken = `{{#if (parseInt ${CID})}}{{#each ${live()}}}{{#if (eq (lowercase code) (lowercase (body 'code')))}}true{{/if}}{{/each}}{{/if}}`

const row = (id) => `(jmesPath (dataRaw '${B}') (concat '"' ${id} '"'))`
const created = `{{~setVar 'id' (add (jmesPath (dataRaw '${B}') 'max(values(@)[].id)') 1)~}}
{{~setData 'set' '${B}' (getVar 'id') (jsonParse (concat '{"id":' (getVar 'id') ',"company_id":' ${CID} ',"code":' (stringify (body 'code')) ',"name":' (stringify (body 'name')) ',"deleted_at":null}'))~}}
{"data": {{{stringify ${row("(getVar 'id')")}}}}, "message": "Satuan ditambahkan"}`
const updated = `{{~setData 'set' '${B}' (concat (urlParam 'id') '.name') (body 'name')~}}
{"data": {{{stringify ${row("(urlParam 'id')")}}}}, "message": "Satuan diperbarui"}`
const deleted = `{{~setData 'set' '${B}' (concat (urlParam 'id') '.deleted_at') (now)~}}
{"message": "Satuan dihapus"}`

export const data = { [B]: byId(unitSeed) }

export const routes = [
	route('get', 'unit', 'List Unit', [
		resp('unit-list-nocompany', { label: 'No active company', rules: [when(noCompany)], body: list('(array)') }),
		resp('unit-list', {
			label: 'Page',
			isDefault: true,
			body: list(`(sortBy ${live(...search)} (queryParam 'sort_by' '') (queryParam 'sort_order' 'asc'))`)
		})
	]),
	route('get', 'unit/:id', 'Get Unit', [
		resp('unit-get-404', { status: 404, label: 'Not found', rules: [when(missing)], body: json({ message: 'Satuan tidak ditemukan' }) }),
		resp('unit-get', { label: 'Found', isDefault: true, body: `{"data": {{{stringify ${one}}}} }` })
	]),
	route('post', 'unit', 'Create Unit', [
		resp('unit-post-nocompany', { status: 422, label: 'No active company', rules: [when(noCompany)], body: json({ message: 'Pilih perusahaan aktif terlebih dahulu' }) }),
		resp('unit-post-taken', {
			status: 422,
			label: 'Code taken',
			rules: [when(taken)],
			body: json({ message: 'Validasi gagal', errors: { code: ['Kode satuan sudah dipakai'] } })
		}),
		resp('unit-post', { status: 201, label: 'Created', isDefault: true, body: created })
	]),
	route('put', 'unit/:id', 'Update Unit (code is immutable)', [
		resp('unit-put-404', { status: 404, label: 'Not found', rules: [when(missing)], body: json({ message: 'Satuan tidak ditemukan' }) }),
		resp('unit-put', { label: 'Updated', isDefault: true, body: updated })
	]),
	route('delete', 'unit/:id', 'Delete Unit (soft)', [
		resp('unit-delete-404', { status: 404, label: 'Not found', rules: [when(missing)], body: json({ message: 'Satuan tidak ditemukan' }) }),
		resp('unit-delete', { label: 'Deleted', isDefault: true, body: deleted })
	])
]
