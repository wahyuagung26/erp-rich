// Contract: docs/company/. Mirrors frontend/src/mocks/modules/company.ts.
// Ported so far: list + get (the app reads them to pick the active company). create/update/delete are NOT ported yet.
import { byId, jp, when, resp, route, search, listBody, json } from '../lib.mjs'
import { companySeed } from '../../frontend/src/mocks/fixtures/company.ts'

const B = 'company'
const live = (...extra) => jp(B, 'values(@)[?deleted_at==null', ...extra, ']')
const one = jp(B, 'values(@)[?id==`', "(urlParam 'id')", '` && deleted_at==null] | [0]')

export const data = { [B]: byId(companySeed) }

export const routes = [
	route('get', 'company', 'List Company', [
		resp('company-list', {
			label: 'Page',
			isDefault: true,
			body: listBody(`(sortBy ${live(...search('code', 'short_name', 'legal_name'))} (queryParam 'sort_by' '') (queryParam 'sort_order' 'asc'))`)
		})
	]),
	route('get', 'company/:id', 'Get Company', [
		resp('company-get-404', {
			status: 404,
			label: 'Not found',
			rules: [when(`{{#if ${one}}}false{{else}}true{{/if}}`)],
			body: json({ message: 'Perusahaan tidak ditemukan' })
		}),
		resp('company-get', { label: 'Found', isDefault: true, body: `{"data": {{{stringify ${one}}}} }` })
	])
]
