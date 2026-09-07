import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/channel',
		meta: { breadcrumb: 'Channel' },
		children: [
			{
				path: '',
				name: 'ChannelList',
				component: () => import('@/views/channel/pages/PageChannelTable.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'ChannelCreate',
				component: () => import('@/views/channel/pages/PageChannelTambah.vue'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'ChannelEdit',
				component: () => import('@/views/channel/pages/PageChannelEdit.vue'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'ChannelDetail',
				component: () => import('@/views/channel/pages/PageChannelDetail.vue'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	}
] satisfies RouteRecordRaw[]
