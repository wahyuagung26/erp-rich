import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/delivery-note',
		meta: { breadcrumb: 'Surat Jalan' },
		children: [
			{
				path: '',
				name: 'DeliveryNoteList',
				component: () => import('@/views/delivery-note/pages/PageDeliveryNoteTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'DeliveryNoteCreate',
				component: () => import('@/views/delivery-note/pages/PageDeliveryNoteTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'DeliveryNoteEdit',
				component: () => import('@/views/delivery-note/pages/PageDeliveryNoteEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'DeliveryNoteDetail',
				component: () => import('@/views/delivery-note/pages/PageDeliveryNoteDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
