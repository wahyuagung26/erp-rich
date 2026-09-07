import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/product',
		meta: { breadcrumb: 'Produk' },
		children: [
			{
				path: '',
				name: 'ProductList',
				component: () => import('@/views/product/pages/PageProductTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'ProductCreate',
				component: () => import('@/views/product/pages/PageProductTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'ProductEdit',
				component: () => import('@/views/product/pages/PageProductEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'ProductDetail',
				component: () => import('@/views/product/pages/PageProductDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
