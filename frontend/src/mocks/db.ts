import { akunSeed } from './fixtures/akun'
import { jurnalSeed } from './fixtures/jurnal'
import { supplierSeed } from './fixtures/supplier'
import { customerSeed } from './fixtures/customer'
import { perusahaanSeed } from './fixtures/perusahaan'
import { merkSeed } from './fixtures/merk'
import { kategoriSeed } from './fixtures/kategori'
import { satuanSeed } from './fixtures/satuan'
import type { Akun, Jurnal, Supplier, Customer, Perusahaan, Merk, Kategori, Satuan } from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: {
	akun: Akun[]
	jurnal: Jurnal[]
	supplier: Supplier[]
	customer: Customer[]
	perusahaan: Perusahaan[]
	merk: Merk[]
	kategori: Kategori[]
	satuan: Satuan[]
} = {
	akun: structuredClone(akunSeed),
	jurnal: structuredClone(jurnalSeed),
	supplier: structuredClone(supplierSeed),
	customer: structuredClone(customerSeed),
	perusahaan: structuredClone(perusahaanSeed),
	merk: structuredClone(merkSeed),
	kategori: structuredClone(kategoriSeed),
	satuan: structuredClone(satuanSeed)
}
