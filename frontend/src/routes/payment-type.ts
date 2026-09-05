import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/payment-type',
		meta: { breadcrumb: 'Tipe Pembayaran' },
		children: [
			{
				path: '',
				name: 'PaymentTypeList',
				component: () => import('@/views/payment-type/pages/PagePaymentTypeTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'PaymentTypeCreate',
				component: () => import('@/views/payment-type/pages/PagePaymentTypeTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'PaymentTypeEdit',
				component: () => import('@/views/payment-type/pages/PagePaymentTypeEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'PaymentTypeDetail',
				component: () => import('@/views/payment-type/pages/PagePaymentTypeDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
