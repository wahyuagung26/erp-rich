import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-expense',
		meta: { breadcrumb: 'Biaya Penjualan' },
		children: [
			{
				path: '',
				name: 'SalesExpenseList',
				component: () => import('@/views/sales-expense/pages/PageSalesExpenseTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesExpenseCreate',
				component: () => import('@/views/sales-expense/pages/PageSalesExpenseTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesExpenseEdit',
				component: () => import('@/views/sales-expense/pages/PageSalesExpenseEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesExpenseDetail',
				component: () => import('@/views/sales-expense/pages/PageSalesExpenseDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
