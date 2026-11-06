import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-return',
		meta: { breadcrumb: 'Retur Penjualan' },
		children: [
			{
				path: '',
				name: 'SalesReturnList',
				component: () => import('@/views/sales-return/pages/PageSalesReturnTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesReturnCreate',
				component: () => import('@/views/sales-return/pages/PageSalesReturnTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesReturnEdit',
				component: () => import('@/views/sales-return/pages/PageSalesReturnEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesReturnDetail',
				component: () => import('@/views/sales-return/pages/PageSalesReturnDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
