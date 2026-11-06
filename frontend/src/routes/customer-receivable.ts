import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/customer-receivable',
		meta: { breadcrumb: 'Piutang Customer' },
		children: [
			{
				path: '',
				name: 'CustomerReceivableList',
				component: () => import('@/views/customer-receivable/pages/PageCustomerReceivableTable.vue'),
				meta: { auth: true }
			},
			{
				path: ':id',
				name: 'CustomerReceivableDetail',
				component: () => import('@/views/customer-receivable/pages/PageCustomerReceivableDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
