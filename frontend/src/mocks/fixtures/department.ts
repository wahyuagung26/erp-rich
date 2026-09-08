import type { Department } from '@/utils/types'

export const departmentSeed: Department[] = [
	{ id: 1, company_id: 1, code: 'FIN', name: 'Finance', deleted_at: null },
	{ id: 2, company_id: 2, code: 'HRD', name: 'Human Resources', deleted_at: null },
	{ id: 3, company_id: 3, code: 'MKT', name: 'Marketing', deleted_at: null },
	// Observed RICH tenant (company 1) departments used by the supplier-advance module.
	// Legacy shows these as a single label, so code === name.
	{ id: 4, company_id: 1, code: 'FAT', name: 'FAT', deleted_at: null },
	{ id: 5, company_id: 1, code: 'HRGA', name: 'HRGA', deleted_at: null },
	{ id: 6, company_id: 1, code: 'Legal', name: 'Legal', deleted_at: null },
	{ id: 7, company_id: 1, code: 'Corporate Secretary', name: 'Corporate Secretary', deleted_at: null },
	{ id: 8, company_id: 1, code: 'IT Internal Support', name: 'IT Internal Support', deleted_at: null },
	{ id: 9, company_id: 1, code: 'Sales', name: 'Sales', deleted_at: null },
	{ id: 10, company_id: 1, code: 'Produksi', name: 'Produksi', deleted_at: null },
	{ id: 11, company_id: 1, code: 'Other - Perkebunan', name: 'Other - Perkebunan', deleted_at: null },
	{ id: 12, company_id: 1, code: 'BOD/ BOC', name: 'BOD/ BOC', deleted_at: null },
	{ id: 13, company_id: 1, code: 'Marketing', name: 'Marketing', deleted_at: null },
	{ id: 14, company_id: 1, code: 'IT ERP External', name: 'IT ERP External', deleted_at: null },
	{ id: 15, company_id: 1, code: 'IT Bus Dev', name: 'IT Bus Dev', deleted_at: null },
	{ id: 16, company_id: 1, code: 'Audit', name: 'Audit', deleted_at: null },
	{ id: 17, company_id: 1, code: 'Operasional', name: 'Operasional', deleted_at: null },
	{ id: 18, company_id: 1, code: 'Strategic Partnership', name: 'Strategic Partnership', deleted_at: null },
	{ id: 19, company_id: 1, code: 'Purchasing', name: 'Purchasing', deleted_at: null }
]
