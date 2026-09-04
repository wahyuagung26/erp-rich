import MockAdapter from 'axios-mock-adapter'
import api from '@/utils/api'
import { registerAuth } from './modules/auth'
import { registerPerusahaan } from './modules/perusahaan'
import { registerMerk } from './modules/merk'
import { registerKategori } from './modules/kategori'
import { registerSatuan } from './modules/satuan'
import { registerCabang } from './modules/cabang'
import { registerDepartemen } from './modules/departemen'
import { registerGudang } from './modules/gudang'
import { registerGroupAkun } from './modules/group-akun'
import { registerSubAkun } from './modules/sub-akun'
import { registerAkunPerkiraan } from './modules/akun-perkiraan'
import { registerJenisPenjualan } from './modules/jenis-penjualan'
import { registerTipePembayaran } from './modules/tipe-pembayaran'
import { registerSupplier } from './modules/supplier'
import { registerCustomer } from './modules/customer'
import { registerJurnal } from './modules/jurnal'
import { registerDashboard } from './modules/dashboard'

// One entry point for all mocking. Register a new module here; keep its
// handlers in src/mocks/modules/<module>.ts and its contract in docs/<module>/.
const modules = [
	registerAuth,
	registerPerusahaan,
	registerMerk,
	registerKategori,
	registerSatuan,
	registerCabang,
	registerDepartemen,
	registerGudang,
	registerGroupAkun,
	registerSubAkun,
	registerAkunPerkiraan,
	registerJenisPenjualan,
	registerTipePembayaran,
	registerSupplier,
	registerCustomer,
	registerJurnal,
	registerDashboard
]

// Dev-only. Attaches an adapter to the real `api` instance so production code
// is identical once the backend is live — flip VITE_USE_MOCK=false to remove it.
export function startMock() {
	const mock = new MockAdapter(api, { delayResponse: 250 })
	modules.forEach((register) => register(mock))
	// eslint-disable-next-line no-console
	console.info('%c[mock] API mocking enabled', 'color:#0E7C6B')
}
