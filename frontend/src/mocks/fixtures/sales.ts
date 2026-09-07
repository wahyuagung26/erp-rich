import type { Sales } from '@/utils/types'

export const salesSeed: Sales[] = [
	{ id: 1, company_id: 1, code: 'SL01', name: 'Budi Santoso', address: 'Jl. Merdeka No. 10, Bandung', deleted_at: null },
	{ id: 2, company_id: 1, code: 'SL02', name: 'Siti Aminah', address: 'Jl. Asia Afrika No. 5, Bandung', deleted_at: null },
	{ id: 3, company_id: 2, code: 'SL01', name: 'Agus Wijaya', address: '', deleted_at: null }
]
