import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/journal-expense',
		meta: { breadcrumb: 'Jurnal Pengeluaran' },
		children: [
			{
				path: '',
				name: 'JournalExpenseList',
				component: () => import('@/views/journal-expense/pages/PageJournalExpenseTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'JournalExpenseCreate',
				component: () => import('@/views/journal-expense/pages/PageJournalExpenseTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'JournalExpenseEdit',
				component: () => import('@/views/journal-expense/pages/PageJournalExpenseEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'JournalExpenseDetail',
				component: () => import('@/views/journal-expense/pages/PageJournalExpenseDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
