import MockAdapter from 'axios-mock-adapter'
import api from '@/utils/api'
import { registerAuth } from './modules/auth'
import { registerAkun } from './modules/akun'
import { registerPerusahaan } from './modules/perusahaan'
import { registerMerk } from './modules/merk'
import { registerSupplier } from './modules/supplier'
import { registerCustomer } from './modules/customer'
import { registerJurnal } from './modules/jurnal'
import { registerDashboard } from './modules/dashboard'

// One entry point for all mocking. Register a new module here; keep its
// handlers in src/mocks/modules/<module>.ts and its contract in docs/<module>/.
const modules = [registerAuth, registerAkun, registerPerusahaan, registerMerk, registerSupplier, registerCustomer, registerJurnal, registerDashboard]

// Dev-only. Attaches an adapter to the real `api` instance so production code
// is identical once the backend is live — flip VITE_USE_MOCK=false to remove it.
export function startMock() {
	const mock = new MockAdapter(api, { delayResponse: 250 })
	modules.forEach((register) => register(mock))
	// eslint-disable-next-line no-console
	console.info('%c[mock] API mocking enabled', 'color:#0E7C6B')
}
