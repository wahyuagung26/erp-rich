import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-order',
		meta: { breadcrumb: 'Sales Order' },
		children: [
			{
				path: '',
				name: 'SalesOrderList',
				component: () => import('@/views/sales-order/pages/PageSalesOrderTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesOrderCreate',
				component: () => import('@/views/sales-order/pages/PageSalesOrderTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesOrderEdit',
				component: () => import('@/views/sales-order/pages/PageSalesOrderEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesOrderDetail',
				component: () => import('@/views/sales-order/pages/PageSalesOrderDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
