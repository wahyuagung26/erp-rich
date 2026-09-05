import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/unit',
		meta: { breadcrumb: 'Satuan' },
		children: [
			{
				path: '',
				name: 'UnitList',
				component: () => import('@/views/unit/pages/PageUnitTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'UnitCreate',
				component: () => import('@/views/unit/pages/PageUnitTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'UnitEdit',
				component: () => import('@/views/unit/pages/PageUnitEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'UnitDetail',
				component: () => import('@/views/unit/pages/PageUnitDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
