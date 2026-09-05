import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/warehouse',
		meta: { breadcrumb: 'Gudang' },
		children: [
			{
				path: '',
				name: 'WarehouseList',
				component: () => import('@/views/warehouse/pages/PageWarehouseTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'WarehouseCreate',
				component: () => import('@/views/warehouse/pages/PageWarehouseTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'WarehouseEdit',
				component: () => import('@/views/warehouse/pages/PageWarehouseEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'WarehouseDetail',
				component: () => import('@/views/warehouse/pages/PageWarehouseDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
