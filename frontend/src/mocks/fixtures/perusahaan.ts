import type { Perusahaan } from '@/utils/types'

export const perusahaanSeed: Perusahaan[] = [
	{
		id: 1,
		code: 'RIN',
		short_name: 'PT RIN',
		legal_name: 'PT Rahadhyan Integrasi Nusantara',
		npwp: '31.234.567.8-421.000',
		logo_url: '',
		address: 'Jalan Kaum Kaler, RT.023/RW.003, Manonjaya, Kec. Manonjaya, Kabupaten Tasikmalaya, Jawa Barat',
		company_type: 'pt',
		hr_enabled: true,
		report_header_color: '#B0F2B1',
		deleted_at: null
	},
	{
		id: 2,
		code: 'SERA',
		short_name: 'PT Samudra Edukasi Raya',
		legal_name: 'PT Samudra Edukasi Raya',
		npwp: '10.000.000.7-468.535',
		logo_url: '',
		address: 'Perum Griya Sakinah Al Kautsar Blok C No 30, Jiwan, Kab Madiun, Jawa Timur',
		company_type: 'pt',
		hr_enabled: false,
		report_header_color: '#CFE8FF',
		deleted_at: null
	},
	{
		id: 3,
		code: 'RJK',
		short_name: 'CV Rejeki Nomplok',
		legal_name: 'CV Rejeki Nomplok',
		npwp: '',
		logo_url: '',
		address: 'Jl. Diponegoro No. 45, Sidoarjo, Jawa Timur',
		company_type: 'cv',
		hr_enabled: false,
		report_header_color: '#FFE1B0',
		deleted_at: null
	}
]
