import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/purchase-invoice',
		meta: { breadcrumb: 'Invoice Pembelian' },
		children: [
			{
				path: '',
				name: 'PurchaseInvoiceList',
				component: () => import('@/views/purchase-invoice/pages/PagePurchaseInvoiceTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PurchaseInvoiceCreate',
				component: () => import('@/views/purchase-invoice/pages/PagePurchaseInvoiceTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PurchaseInvoiceEdit',
				component: () => import('@/views/purchase-invoice/pages/PagePurchaseInvoiceEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PurchaseInvoiceDetail',
				component: () => import('@/views/purchase-invoice/pages/PagePurchaseInvoiceDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
