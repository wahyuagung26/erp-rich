import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/posting',
		name: 'Posting',
		component: () => import('@/views/posting/pages/PagePosting.vue'),
		meta: { auth: true, breadcrumb: 'Posting' }
	}
] satisfies RouteRecordRaw[]
