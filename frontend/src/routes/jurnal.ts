import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/jurnal',
		meta: { breadcrumb: 'Jurnal Umum' },
		children: [
			{
				path: '',
				name: 'JurnalList',
				component: () => import('@/views/jurnal/pages/PageJurnalTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'JurnalCreate',
				component: () => import('@/views/jurnal/pages/PageJurnalTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			}
		]
	}
] satisfies RouteRecordRaw[]
