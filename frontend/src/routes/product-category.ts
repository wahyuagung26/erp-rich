import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/product-category',
		meta: { breadcrumb: 'Kategori' },
		children: [
			{
				path: '',
				name: 'ProductCategoryList',
				component: () => import('@/views/product-category/pages/PageProductCategoryTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'ProductCategoryCreate',
				component: () => import('@/views/product-category/pages/PageProductCategoryTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'ProductCategoryEdit',
				component: () => import('@/views/product-category/pages/PageProductCategoryEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'ProductCategoryDetail',
				component: () => import('@/views/product-category/pages/PageProductCategoryDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
