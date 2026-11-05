import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/supplier-payable',
		meta: { breadcrumb: 'Hutang Supplier' },
		children: [
			{
				path: '',
				name: 'SupplierPayableList',
				component: () => import('@/views/supplier-payable/pages/PageSupplierPayableTable.vue'),
				meta: { auth: true }
			},
			{
				path: ':id',
				name: 'SupplierPayableDetail',
				component: () => import('@/views/supplier-payable/pages/PageSupplierPayableDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
