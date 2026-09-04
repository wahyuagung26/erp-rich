import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/cabang',
		meta: { breadcrumb: 'Cabang' },
		children: [
			{
				path: '',
				name: 'CabangList',
				component: () => import('@/views/cabang/pages/PageCabangTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'CabangCreate',
				component: () => import('@/views/cabang/pages/PageCabangTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'CabangEdit',
				component: () => import('@/views/cabang/pages/PageCabangEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'CabangDetail',
				component: () => import('@/views/cabang/pages/PageCabangDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
