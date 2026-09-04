import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/jenis-penjualan',
		meta: { breadcrumb: 'Jenis Penjualan' },
		children: [
			{
				path: '',
				name: 'JenisPenjualanList',
				component: () => import('@/views/jenis-penjualan/pages/PageJenisPenjualanTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'JenisPenjualanCreate',
				component: () => import('@/views/jenis-penjualan/pages/PageJenisPenjualanTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'JenisPenjualanEdit',
				component: () => import('@/views/jenis-penjualan/pages/PageJenisPenjualanEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'JenisPenjualanDetail',
				component: () => import('@/views/jenis-penjualan/pages/PageJenisPenjualanDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
