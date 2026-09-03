import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/dashboard',
		name: 'Dashboard',
		component: () => import('@/views/dashboard/index.vue'),
		meta: { auth: true, breadcrumb: 'Dashboard' }
	}
] satisfies RouteRecordRaw[]
