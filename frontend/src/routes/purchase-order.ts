import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/purchase-order',
		meta: { breadcrumb: 'Order Pembelian' },
		children: [
			{
				path: '',
				name: 'PurchaseOrderList',
				component: () => import('@/views/purchase-order/pages/PagePurchaseOrderTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PurchaseOrderCreate',
				component: () => import('@/views/purchase-order/pages/PagePurchaseOrderTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PurchaseOrderEdit',
				component: () => import('@/views/purchase-order/pages/PagePurchaseOrderEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PurchaseOrderDetail',
				component: () => import('@/views/purchase-order/pages/PagePurchaseOrderDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
