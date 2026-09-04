import { jurnalSeed } from './fixtures/jurnal'
import { supplierSeed } from './fixtures/supplier'
import { customerSeed } from './fixtures/customer'
import { perusahaanSeed } from './fixtures/perusahaan'
import { merkSeed } from './fixtures/merk'
import { kategoriSeed } from './fixtures/kategori'
import { satuanSeed } from './fixtures/satuan'
import { cabangSeed } from './fixtures/cabang'
import { departemenSeed } from './fixtures/departemen'
import { gudangSeed } from './fixtures/gudang'
import { groupAkunSeed } from './fixtures/group-akun'
import { subAkunSeed } from './fixtures/sub-akun'
import { akunPerkiraanSeed } from './fixtures/akun-perkiraan'
import { jenisPenjualanSeed } from './fixtures/jenis-penjualan'
import type {
	Jurnal,
	Supplier,
	Customer,
	Perusahaan,
	Merk,
	Kategori,
	Satuan,
	Cabang,
	Departemen,
	Gudang,
	GroupAkun,
	SubAkun,
	AkunPerkiraan,
	JenisPenjualan
} from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: {
	jurnal: Jurnal[]
	supplier: Supplier[]
	customer: Customer[]
	perusahaan: Perusahaan[]
	merk: Merk[]
	kategori: Kategori[]
	satuan: Satuan[]
	cabang: Cabang[]
	departemen: Departemen[]
	gudang: Gudang[]
	groupAkun: GroupAkun[]
	subAkun: SubAkun[]
	akunPerkiraan: AkunPerkiraan[]
	jenisPenjualan: JenisPenjualan[]
} = {
	jurnal: structuredClone(jurnalSeed),
	supplier: structuredClone(supplierSeed),
	customer: structuredClone(customerSeed),
	perusahaan: structuredClone(perusahaanSeed),
	merk: structuredClone(merkSeed),
	kategori: structuredClone(kategoriSeed),
	satuan: structuredClone(satuanSeed),
	cabang: structuredClone(cabangSeed),
	departemen: structuredClone(departemenSeed),
	gudang: structuredClone(gudangSeed),
	groupAkun: structuredClone(groupAkunSeed),
	subAkun: structuredClone(subAkunSeed),
	akunPerkiraan: structuredClone(akunPerkiraanSeed),
	jenisPenjualan: structuredClone(jenisPenjualanSeed)
}
