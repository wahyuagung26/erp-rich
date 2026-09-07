import type { RouteRecordRaw } from 'vue-router'

export default [
	{
		path: '/product-price',
		name: 'ProductPriceList',
		component: () => import('@/views/product-price/pages/PageProductPriceTable.vue'),
		meta: { auth: true, breadcrumb: 'Harga Produk' }
	}
] satisfies RouteRecordRaw[]
