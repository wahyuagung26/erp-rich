import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/journal',
		meta: { breadcrumb: 'Jurnal Umum' },
		children: [
			{
				path: '',
				name: 'JournalList',
				component: () => import('@/views/journal/pages/PageJournalTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'JournalCreate',
				component: () => import('@/views/journal/pages/PageJournalTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			}
		]
	}
] satisfies RouteRecordRaw[]
