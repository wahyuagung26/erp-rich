import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/gudang',
		meta: { breadcrumb: 'Gudang' },
		children: [
			{
				path: '',
				name: 'GudangList',
				component: () => import('@/views/gudang/pages/PageGudangTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'GudangCreate',
				component: () => import('@/views/gudang/pages/PageGudangTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'GudangEdit',
				component: () => import('@/views/gudang/pages/PageGudangEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'GudangDetail',
				component: () => import('@/views/gudang/pages/PageGudangDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
