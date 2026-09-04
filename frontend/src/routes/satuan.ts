import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/satuan',
		meta: { breadcrumb: 'Satuan' },
		children: [
			{
				path: '',
				name: 'SatuanList',
				component: () => import('@/views/satuan/pages/PageSatuanTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SatuanCreate',
				component: () => import('@/views/satuan/pages/PageSatuanTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SatuanEdit',
				component: () => import('@/views/satuan/pages/PageSatuanEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SatuanDetail',
				component: () => import('@/views/satuan/pages/PageSatuanDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
