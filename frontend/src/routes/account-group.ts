import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/account-group',
		meta: { breadcrumb: 'Group Akun' },
		children: [
			{
				path: '',
				name: 'AccountGroupList',
				component: () => import('@/views/account-group/pages/PageAccountGroupTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'AccountGroupCreate',
				component: () => import('@/views/account-group/pages/PageAccountGroupTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'AccountGroupEdit',
				component: () => import('@/views/account-group/pages/PageAccountGroupEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'AccountGroupDetail',
				component: () => import('@/views/account-group/pages/PageAccountGroupDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
