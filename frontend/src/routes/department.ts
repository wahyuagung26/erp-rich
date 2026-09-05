import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/department',
		meta: { breadcrumb: 'Departemen' },
		children: [
			{
				path: '',
				name: 'DepartmentList',
				component: () => import('@/views/department/pages/PageDepartmentTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'DepartmentCreate',
				component: () => import('@/views/department/pages/PageDepartmentTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'DepartmentEdit',
				component: () => import('@/views/department/pages/PageDepartmentEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'DepartmentDetail',
				component: () => import('@/views/department/pages/PageDepartmentDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
