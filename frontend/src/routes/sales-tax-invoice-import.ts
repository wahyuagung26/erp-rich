import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-tax-invoice-import',
		name: 'SalesTaxInvoiceImport',
		component: () => import('@/views/sales-tax-invoice-import/pages/PageSalesTaxInvoiceImport.vue'),
		meta: { auth: true, breadcrumb: 'Import Faktur Pajak' }
	}
] satisfies RouteRecordRaw[]
