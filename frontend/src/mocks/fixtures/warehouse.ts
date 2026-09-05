import type { Warehouse } from '@/utils/types'

export const warehouseSeed: Warehouse[] = [
	{
		id: 1,
		company_id: 1,
		code: 'GD1',
		name: 'Gudang Pusat',
		branch_id: 1,
		branch_code: 'PST',
		branch_name: 'Kantor Pusat',
		address: 'Jl. Kaum Kaler, Manonjaya, Tasikmalaya',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 2,
		code: 'GD1',
		name: 'Gudang Madiun',
		branch_id: 2,
		branch_code: 'MDN',
		branch_name: 'Cabang Madiun',
		address: '',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 3,
		code: 'GD1',
		name: 'Gudang Sidoarjo',
		branch_id: 3,
		branch_code: 'SDA',
		branch_name: 'Cabang Sidoarjo',
		address: 'Jl. Gajah Mada No. 5, Sidoarjo',
		deleted_at: null
	}
]
