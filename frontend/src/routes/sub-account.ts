import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sub-account',
		meta: { breadcrumb: 'Sub Akun' },
		children: [
			{
				path: '',
				name: 'SubAccountList',
				component: () => import('@/views/sub-account/pages/PageSubAccountTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SubAccountCreate',
				component: () => import('@/views/sub-account/pages/PageSubAccountTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SubAccountEdit',
				component: () => import('@/views/sub-account/pages/PageSubAccountEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SubAccountDetail',
				component: () => import('@/views/sub-account/pages/PageSubAccountDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
