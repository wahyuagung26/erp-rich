import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/bank-account',
		meta: { breadcrumb: 'Rekening Bank' },
		children: [
			{
				path: '',
				name: 'BankAccountList',
				component: () => import('@/views/bank-account/pages/PageBankAccountTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'BankAccountCreate',
				component: () => import('@/views/bank-account/pages/PageBankAccountTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'BankAccountEdit',
				component: () => import('@/views/bank-account/pages/PageBankAccountEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'BankAccountDetail',
				component: () => import('@/views/bank-account/pages/PageBankAccountDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
