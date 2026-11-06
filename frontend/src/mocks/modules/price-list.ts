import type MockAdapter from 'axios-mock-adapter'
import { db } from '../db'
import { paginate, sortBy, companyIdOf, type ListParams } from '../lib'
import { priceListStockSeed } from '../fixtures/price-list'
import type { PriceListRow } from '@/utils/types'

// Contract: docs/price-list/. Read-only view over the product master (db.product) + a static stock seed.
// Company-scoped — see docs/conventions.md#company-scoping. Not subject to the closing-period lock.
export function registerPriceList(mock: MockAdapter) {
	mock.onGet('/price-list').reply((config) => {
		const p = (config.params ?? {}) as ListParams
		const companyId = companyIdOf(config)
		if (companyId === null) return [200, paginate([], p)]

		// Stock counts only gudang of the active company; `warehouse_id` narrows it to one gudang.
		const warehouseIds = new Set(db.warehouse.filter((w) => !w.deleted_at && w.company_id === companyId).map((w) => w.id))
		const only = p.warehouse_id ? Number(p.warehouse_id) : null
		const stockOf = (productId: number) =>
			priceListStockSeed
				.filter((s) => s.product_id === productId && warehouseIds.has(s.warehouse_id) && (only === null || s.warehouse_id === only))
				.reduce((sum, s) => sum + s.qty, 0)

		let rows: PriceListRow[] = db.product
			.filter((prod) => !prod.deleted_at && prod.company_id === companyId)
			.map((prod) => {
				const stock_qty = prod.type === 'service' ? null : stockOf(prod.id)
				return {
					id: prod.id,
					code: prod.code,
					name: prod.name,
					type: prod.type,
					brand_id: prod.brand_id,
					brand_code: prod.brand_code,
					brand_name: prod.brand_name,
					product_category_id: prod.product_category_id,
					product_category_code: prod.product_category_code,
					product_category_name: prod.product_category_name,
					unit_name: prod.unit_name,
					selling_price: prod.selling_price,
					has_price: prod.selling_price > 0,
					stock_qty,
					min_stock: prod.min_stock,
					stock_warning: stock_qty === null ? null : stock_qty <= 0 ? 'empty' : stock_qty < prod.min_stock ? 'low' : null
				}
			})

		if (p.q) {
			const q = String(p.q).toLowerCase()
			rows = rows.filter((r) => `${r.code} ${r.name}`.toLowerCase().includes(q))
		}
		if (p.brand_id) rows = rows.filter((r) => r.brand_id === Number(p.brand_id))
		if (p.product_category_id) rows = rows.filter((r) => r.product_category_id === Number(p.product_category_id))
		if (p.price_status === 'unset') rows = rows.filter((r) => !r.has_price)
		rows = sortBy(rows, p.sort_by, p.sort_order)
		return [200, paginate(rows, p)]
	})
}
