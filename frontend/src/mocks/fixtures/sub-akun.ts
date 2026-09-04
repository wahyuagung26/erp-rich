import type { SubAkun } from '@/utils/types'

export const subAkunSeed: SubAkun[] = [
	{
		id: 1,
		company_id: 1,
		group_akun_id: 1,
		group_akun_code: '10',
		group_akun_name: 'Aset',
		code: '10001',
		name: 'Kas',
		normal_balance: 'debit',
		deleted_at: null
	},
	{
		id: 2,
		company_id: 1,
		group_akun_id: 2,
		group_akun_code: '60',
		group_akun_name: 'Beban',
		code: '60001',
		name: 'Beban Gaji',
		normal_balance: 'debit',
		deleted_at: null
	},
	{
		id: 3,
		company_id: 2,
		group_akun_id: 3,
		group_akun_code: '40',
		group_akun_name: 'Pendapatan',
		code: '40001',
		name: 'Pendapatan Jasa',
		normal_balance: 'credit',
		deleted_at: null
	},
	{
		id: 4,
		company_id: 3,
		group_akun_id: 4,
		group_akun_code: '20',
		group_akun_name: 'Kewajiban',
		code: '20001',
		name: 'Utang Usaha',
		normal_balance: 'credit',
		deleted_at: null
	}
]
