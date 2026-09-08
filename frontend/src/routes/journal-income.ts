import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/journal-income',
		meta: { breadcrumb: 'Jurnal Pemasukan' },
		children: [
			{
				path: '',
				name: 'JournalIncomeList',
				component: () => import('@/views/journal-income/pages/PageJournalIncomeTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'JournalIncomeCreate',
				component: () => import('@/views/journal-income/pages/PageJournalIncomeTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'JournalIncomeEdit',
				component: () => import('@/views/journal-income/pages/PageJournalIncomeEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'JournalIncomeDetail',
				component: () => import('@/views/journal-income/pages/PageJournalIncomeDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
