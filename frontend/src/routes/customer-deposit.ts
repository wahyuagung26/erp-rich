import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/customer-deposit',
		meta: { breadcrumb: 'Titipan Customer' },
		children: [
			{
				path: '',
				name: 'CustomerDepositList',
				component: () => import('@/views/customer-deposit/pages/PageCustomerDepositTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'CustomerDepositCreate',
				component: () => import('@/views/customer-deposit/pages/PageCustomerDepositTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'CustomerDepositEdit',
				component: () => import('@/views/customer-deposit/pages/PageCustomerDepositEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'CustomerDepositDetail',
				component: () => import('@/views/customer-deposit/pages/PageCustomerDepositDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
