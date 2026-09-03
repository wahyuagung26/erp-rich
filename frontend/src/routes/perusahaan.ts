import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/perusahaan',
		meta: { breadcrumb: 'Perusahaan' },
		children: [
			{
				path: '',
				name: 'PerusahaanList',
				component: () => import('@/views/perusahaan/pages/PagePerusahaanTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PerusahaanCreate',
				component: () => import('@/views/perusahaan/pages/PagePerusahaanTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PerusahaanEdit',
				component: () => import('@/views/perusahaan/pages/PagePerusahaanEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PerusahaanDetail',
				component: () => import('@/views/perusahaan/pages/PagePerusahaanDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
