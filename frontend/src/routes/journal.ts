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
			},
			{
				path: 'edit/:id',
				name: 'JournalEdit',
				component: () => import('@/views/journal/pages/PageJournalEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'JournalDetail',
				component: () => import('@/views/journal/pages/PageJournalDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
