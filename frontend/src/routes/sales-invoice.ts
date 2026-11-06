import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-invoice',
		meta: { breadcrumb: 'Invoice Penjualan' },
		children: [
			{
				path: '',
				name: 'SalesInvoiceList',
				component: () => import('@/views/sales-invoice/pages/PageSalesInvoiceTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesInvoiceCreate',
				component: () => import('@/views/sales-invoice/pages/PageSalesInvoiceTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesInvoiceEdit',
				component: () => import('@/views/sales-invoice/pages/PageSalesInvoiceEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesInvoiceDetail',
				component: () => import('@/views/sales-invoice/pages/PageSalesInvoiceDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
