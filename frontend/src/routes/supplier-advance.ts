import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/supplier-advance',
		meta: { breadcrumb: 'Uang Muka Supplier' },
		children: [
			{
				path: '',
				name: 'SupplierAdvanceList',
				component: () => import('@/views/supplier-advance/pages/PageSupplierAdvanceTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SupplierAdvanceCreate',
				component: () => import('@/views/supplier-advance/pages/PageSupplierAdvanceTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SupplierAdvanceEdit',
				component: () => import('@/views/supplier-advance/pages/PageSupplierAdvanceEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SupplierAdvanceDetail',
				component: () => import('@/views/supplier-advance/pages/PageSupplierAdvanceDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
