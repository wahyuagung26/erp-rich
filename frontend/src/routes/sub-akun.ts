import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sub-akun',
		meta: { breadcrumb: 'Sub Akun' },
		children: [
			{
				path: '',
				name: 'SubAkunList',
				component: () => import('@/views/sub-akun/pages/PageSubAkunTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SubAkunCreate',
				component: () => import('@/views/sub-akun/pages/PageSubAkunTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SubAkunEdit',
				component: () => import('@/views/sub-akun/pages/PageSubAkunEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SubAkunDetail',
				component: () => import('@/views/sub-akun/pages/PageSubAkunDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
