import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/price-list',
		name: 'PriceList',
		component: () => import('@/views/price-list/pages/PagePriceListTable.vue'),
		meta: { auth: true, breadcrumb: 'Daftar Harga' }
	}
] satisfies RouteRecordRaw[]
