import type { Gudang } from '@/utils/types'

export const gudangSeed: Gudang[] = [
	{
		id: 1,
		company_id: 1,
		code: 'GD1',
		name: 'Gudang Pusat',
		cabang_id: 1,
		cabang_code: 'PST',
		cabang_name: 'Kantor Pusat',
		address: 'Jl. Kaum Kaler, Manonjaya, Tasikmalaya',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 2,
		code: 'GD1',
		name: 'Gudang Madiun',
		cabang_id: 2,
		cabang_code: 'MDN',
		cabang_name: 'Cabang Madiun',
		address: '',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 3,
		code: 'GD1',
		name: 'Gudang Sidoarjo',
		cabang_id: 3,
		cabang_code: 'SDA',
		cabang_name: 'Cabang Sidoarjo',
		address: 'Jl. Gajah Mada No. 5, Sidoarjo',
		deleted_at: null
	}
]
