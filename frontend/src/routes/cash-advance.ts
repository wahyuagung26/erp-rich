import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/cash-advance',
		meta: { breadcrumb: 'Uang Muka Operasional' },
		children: [
			{
				path: '',
				name: 'CashAdvanceList',
				component: () => import('@/views/cash-advance/pages/PageCashAdvanceTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'CashAdvanceCreate',
				component: () => import('@/views/cash-advance/pages/PageCashAdvanceTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'CashAdvanceEdit',
				component: () => import('@/views/cash-advance/pages/PageCashAdvanceEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'CashAdvanceDetail',
				component: () => import('@/views/cash-advance/pages/PageCashAdvanceDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
