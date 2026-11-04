import type { Department } from '@/utils/types'

export const departmentSeed: Department[] = [
	{ id: 1, company_id: 1, code: 'FIN', name: 'Finance', deleted_at: null },
	{ id: 2, company_id: 2, code: 'HRD', name: 'Human Resources', deleted_at: null },
	{ id: 3, company_id: 3, code: 'MKT', name: 'Marketing', deleted_at: null },
	// Observed RICH tenant (company 1) departments used by the supplier-advance module.
	// Legacy shows these as a single label; short codes are assigned here so the "{code} — {name}" dropdowns read meaningfully.
	{ id: 4, company_id: 1, code: 'FAT', name: 'FAT', deleted_at: null },
	{ id: 5, company_id: 1, code: 'HRGA', name: 'HRGA', deleted_at: null },
	{ id: 6, company_id: 1, code: 'LGL', name: 'Legal', deleted_at: null },
	{ id: 7, company_id: 1, code: 'CORSEC', name: 'Corporate Secretary', deleted_at: null },
	{ id: 8, company_id: 1, code: 'ITIS', name: 'IT Internal Support', deleted_at: null },
	{ id: 9, company_id: 1, code: 'SLS', name: 'Sales', deleted_at: null },
	{ id: 10, company_id: 1, code: 'PRD', name: 'Produksi', deleted_at: null },
	{ id: 11, company_id: 1, code: 'OTH', name: 'Other - Perkebunan', deleted_at: null },
	{ id: 12, company_id: 1, code: 'BOD', name: 'BOD/ BOC', deleted_at: null },
	{ id: 13, company_id: 1, code: 'MKT', name: 'Marketing', deleted_at: null },
	{ id: 14, company_id: 1, code: 'ITEE', name: 'IT ERP External', deleted_at: null },
	{ id: 15, company_id: 1, code: 'ITBD', name: 'IT Bus Dev', deleted_at: null },
	{ id: 16, company_id: 1, code: 'AUD', name: 'Audit', deleted_at: null },
	{ id: 17, company_id: 1, code: 'OPS', name: 'Operasional', deleted_at: null },
	{ id: 18, company_id: 1, code: 'STR', name: 'Strategic Partnership', deleted_at: null },
	{ id: 19, company_id: 1, code: 'PUR', name: 'Purchasing', deleted_at: null }
]
