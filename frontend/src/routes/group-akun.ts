import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/group-akun',
		meta: { breadcrumb: 'Group Akun' },
		children: [
			{
				path: '',
				name: 'GroupAkunList',
				component: () => import('@/views/group-akun/pages/PageGroupAkunTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'GroupAkunCreate',
				component: () => import('@/views/group-akun/pages/PageGroupAkunTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'GroupAkunEdit',
				component: () => import('@/views/group-akun/pages/PageGroupAkunEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'GroupAkunDetail',
				component: () => import('@/views/group-akun/pages/PageGroupAkunDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
