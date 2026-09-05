import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/brand',
		meta: { breadcrumb: 'Merk' },
		children: [
			{
				path: '',
				name: 'BrandList',
				component: () => import('@/views/brand/pages/PageBrandTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'BrandCreate',
				component: () => import('@/views/brand/pages/PageBrandTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'BrandEdit',
				component: () => import('@/views/brand/pages/PageBrandEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'BrandDetail',
				component: () => import('@/views/brand/pages/PageBrandDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
