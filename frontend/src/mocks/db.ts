import { akunSeed } from './fixtures/akun'
import { jurnalSeed } from './fixtures/jurnal'
import { supplierSeed } from './fixtures/supplier'
import { customerSeed } from './fixtures/customer'
import type { Akun, Jurnal, Supplier, Customer } from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: { akun: Akun[]; jurnal: Jurnal[]; supplier: Supplier[]; customer: Customer[] } = {
	akun: structuredClone(akunSeed),
	jurnal: structuredClone(jurnalSeed),
	supplier: structuredClone(supplierSeed),
	customer: structuredClone(customerSeed)
}
