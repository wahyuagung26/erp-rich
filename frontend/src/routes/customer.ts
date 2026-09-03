import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/customer',
		meta: { breadcrumb: 'Customer' },
		children: [
			{
				path: '',
				name: 'CustomerList',
				component: () => import('@/views/customer/pages/PageCustomerTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'CustomerCreate',
				component: () => import('@/views/customer/pages/PageCustomerTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'CustomerEdit',
				component: () => import('@/views/customer/pages/PageCustomerEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'CustomerDetail',
				component: () => import('@/views/customer/pages/PageCustomerDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
