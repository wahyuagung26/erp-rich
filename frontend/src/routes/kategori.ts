import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/kategori',
		meta: { breadcrumb: 'Kategori' },
		children: [
			{
				path: '',
				name: 'KategoriList',
				component: () => import('@/views/kategori/pages/PageKategoriTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'KategoriCreate',
				component: () => import('@/views/kategori/pages/PageKategoriTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'KategoriEdit',
				component: () => import('@/views/kategori/pages/PageKategoriEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'KategoriDetail',
				component: () => import('@/views/kategori/pages/PageKategoriDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
