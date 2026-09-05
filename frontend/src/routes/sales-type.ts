import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/sales-type',
		meta: { breadcrumb: 'Jenis Penjualan' },
		children: [
			{
				path: '',
				name: 'SalesTypeList',
				component: () => import('@/views/sales-type/pages/PageSalesTypeTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'SalesTypeCreate',
				component: () => import('@/views/sales-type/pages/PageSalesTypeTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'SalesTypeEdit',
				component: () => import('@/views/sales-type/pages/PageSalesTypeEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'SalesTypeDetail',
				component: () => import('@/views/sales-type/pages/PageSalesTypeDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
