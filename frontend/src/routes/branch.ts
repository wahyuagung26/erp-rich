import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/branch',
		meta: { breadcrumb: 'Cabang' },
		children: [
			{
				path: '',
				name: 'BranchList',
				component: () => import('@/views/branch/pages/PageBranchTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'BranchCreate',
				component: () => import('@/views/branch/pages/PageBranchTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'BranchEdit',
				component: () => import('@/views/branch/pages/PageBranchEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'BranchDetail',
				component: () => import('@/views/branch/pages/PageBranchDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
