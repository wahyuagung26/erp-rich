import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/account',
		meta: { breadcrumb: 'Akun Perkiraan' },
		children: [
			{
				path: '',
				name: 'AccountList',
				component: () => import('@/views/account/pages/PageAccountTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'AccountCreate',
				component: () => import('@/views/account/pages/PageAccountTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'AccountEdit',
				component: () => import('@/views/account/pages/PageAccountEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'AccountDetail',
				component: () => import('@/views/account/pages/PageAccountDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
