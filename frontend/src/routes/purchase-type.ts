import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/purchase-type',
		meta: { breadcrumb: 'Jenis Pembelian' },
		children: [
			{
				path: '',
				name: 'PurchaseTypeList',
				component: () => import('@/views/purchase-type/pages/PagePurchaseTypeTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PurchaseTypeCreate',
				component: () => import('@/views/purchase-type/pages/PagePurchaseTypeTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PurchaseTypeEdit',
				component: () => import('@/views/purchase-type/pages/PagePurchaseTypeEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PurchaseTypeDetail',
				component: () => import('@/views/purchase-type/pages/PagePurchaseTypeDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
