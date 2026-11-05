import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/purchase-return',
		meta: { breadcrumb: 'Retur Pembelian' },
		children: [
			{
				path: '',
				name: 'PurchaseReturnList',
				component: () => import('@/views/purchase-return/pages/PagePurchaseReturnTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PurchaseReturnCreate',
				component: () => import('@/views/purchase-return/pages/PagePurchaseReturnTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PurchaseReturnEdit',
				component: () => import('@/views/purchase-return/pages/PagePurchaseReturnEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PurchaseReturnDetail',
				component: () => import('@/views/purchase-return/pages/PagePurchaseReturnDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
