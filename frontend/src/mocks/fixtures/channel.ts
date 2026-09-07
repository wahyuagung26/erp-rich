import type { Channel } from '@/utils/types'

export const channelSeed: Channel[] = [
	{ id: 1, company_id: 1, code: 'CH01', name: 'Toko Offline', notes: 'Penjualan langsung di gerai', deleted_at: null },
	{ id: 2, company_id: 1, code: 'CH02', name: 'Marketplace', notes: 'Tokopedia, Shopee, dsb.', deleted_at: null },
	{ id: 3, company_id: 2, code: 'CH01', name: 'Reseller', notes: '', deleted_at: null }
]
