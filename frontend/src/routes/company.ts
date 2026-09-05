import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/company',
		meta: { breadcrumb: 'Perusahaan' },
		children: [
			{
				path: '',
				name: 'CompanyList',
				component: () => import('@/views/company/pages/PageCompanyTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'CompanyCreate',
				component: () => import('@/views/company/pages/PageCompanyTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'CompanyEdit',
				component: () => import('@/views/company/pages/PageCompanyEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'CompanyDetail',
				component: () => import('@/views/company/pages/PageCompanyDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
