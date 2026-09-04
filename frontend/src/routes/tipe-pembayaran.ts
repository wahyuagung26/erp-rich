import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/tipe-pembayaran',
		meta: { breadcrumb: 'Tipe Pembayaran' },
		children: [
			{
				path: '',
				name: 'TipePembayaranList',
				component: () => import('@/views/tipe-pembayaran/pages/PageTipePembayaranTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'TipePembayaranCreate',
				component: () => import('@/views/tipe-pembayaran/pages/PageTipePembayaranTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'TipePembayaranEdit',
				component: () => import('@/views/tipe-pembayaran/pages/PageTipePembayaranEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'TipePembayaranDetail',
				component: () => import('@/views/tipe-pembayaran/pages/PageTipePembayaranDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
