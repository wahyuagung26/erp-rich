import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/outlook',
		redirect: '/outlook/daily',
		meta: { breadcrumb: 'Outlook & Forecasting' },
		children: [
			{
				path: 'daily',
				name: 'OutlookDaily',
				component: () => import('@/views/outlook/pages/PageOutlookDaily.vue'),
				meta: { auth: true, breadcrumb: 'Outlook Daily' }
			}
		]
	}
] satisfies RouteRecordRaw[]
