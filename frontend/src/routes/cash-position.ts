import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/cash-position',
		name: 'CashPosition',
		component: () => import('@/views/cash-position/pages/PageCashPosition.vue'),
		meta: { auth: true, breadcrumb: 'Posisi Kas & Bank' }
	}
] satisfies RouteRecordRaw[]
