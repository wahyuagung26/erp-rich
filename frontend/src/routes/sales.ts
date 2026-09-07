import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales',
		meta: { breadcrumb: 'Sales' },
		children: [
			{
				path: '',
				name: 'SalesList',
				component: () => import('@/views/sales/pages/PageSalesTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesCreate',
				component: () => import('@/views/sales/pages/PageSalesTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesEdit',
				component: () => import('@/views/sales/pages/PageSalesEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesDetail',
				component: () => import('@/views/sales/pages/PageSalesDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
