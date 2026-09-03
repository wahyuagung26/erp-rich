import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/supplier',
		meta: { breadcrumb: 'Supplier' },
		children: [
			{
				path: '',
				name: 'SupplierList',
				component: () => import('@/views/supplier/pages/PageSupplierTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SupplierCreate',
				component: () => import('@/views/supplier/pages/PageSupplierTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SupplierEdit',
				component: () => import('@/views/supplier/pages/PageSupplierEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SupplierDetail',
				component: () => import('@/views/supplier/pages/PageSupplierDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
