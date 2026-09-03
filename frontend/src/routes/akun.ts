import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/akun',
		meta: { breadcrumb: 'Bagan Akun' },
		children: [
			{
				path: '',
				name: 'AkunList',
				component: () => import('@/views/akun/pages/PageAkunTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'AkunCreate',
				component: () => import('@/views/akun/pages/PageAkunTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'AkunEdit',
				component: () => import('@/views/akun/pages/PageAkunEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			}
		]
	}
] satisfies RouteRecordRaw[]
