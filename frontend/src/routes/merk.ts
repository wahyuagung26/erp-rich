import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/merk',
		meta: { breadcrumb: 'Merk' },
		children: [
			{
				path: '',
				name: 'MerkList',
				component: () => import('@/views/merk/pages/PageMerkTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'MerkCreate',
				component: () => import('@/views/merk/pages/PageMerkTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'MerkEdit',
				component: () => import('@/views/merk/pages/PageMerkEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'MerkDetail',
				component: () => import('@/views/merk/pages/PageMerkDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
