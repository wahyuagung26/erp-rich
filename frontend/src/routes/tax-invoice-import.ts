import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/tax-invoice-import',
		name: 'TaxInvoiceImport',
		component: () => import('@/views/tax-invoice-import/pages/PageTaxInvoiceImport.vue'),
		meta: { auth: true, breadcrumb: 'Import Faktur Pajak' }
	}
] satisfies RouteRecordRaw[]
