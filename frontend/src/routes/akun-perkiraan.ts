import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/akun-perkiraan',
		meta: { breadcrumb: 'Akun Perkiraan' },
		children: [
			{
				path: '',
				name: 'AkunPerkiraanList',
				component: () => import('@/views/akun-perkiraan/pages/PageAkunPerkiraanTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'AkunPerkiraanCreate',
				component: () => import('@/views/akun-perkiraan/pages/PageAkunPerkiraanTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'AkunPerkiraanEdit',
				component: () => import('@/views/akun-perkiraan/pages/PageAkunPerkiraanEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'AkunPerkiraanDetail',
				component: () => import('@/views/akun-perkiraan/pages/PageAkunPerkiraanDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
