import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/departemen',
		meta: { breadcrumb: 'Departemen' },
		children: [
			{
				path: '',
				name: 'DepartemenList',
				component: () => import('@/views/departemen/pages/PageDepartemenTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'DepartemenCreate',
				component: () => import('@/views/departemen/pages/PageDepartemenTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'DepartemenEdit',
				component: () => import('@/views/departemen/pages/PageDepartemenEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'DepartemenDetail',
				component: () => import('@/views/departemen/pages/PageDepartemenDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
