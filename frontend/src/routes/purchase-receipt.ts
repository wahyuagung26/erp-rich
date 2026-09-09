import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/purchase-receipt',
		meta: { breadcrumb: 'Penerimaan Pembelian' },
		children: [
			{
				path: '',
				name: 'PurchaseReceiptList',
				component: () => import('@/views/purchase-receipt/pages/PagePurchaseReceiptTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PurchaseReceiptCreate',
				component: () => import('@/views/purchase-receipt/pages/PagePurchaseReceiptTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PurchaseReceiptEdit',
				component: () => import('@/views/purchase-receipt/pages/PagePurchaseReceiptEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PurchaseReceiptDetail',
				component: () => import('@/views/purchase-receipt/pages/PagePurchaseReceiptDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
