import MockAdapter from 'axios-mock-adapter'
import api from '@/utils/api'
import { registerAuth } from './modules/auth'
import { registerCompany } from './modules/company'
import { registerBrand } from './modules/brand'
import { registerProductCategory } from './modules/product-category'
import { registerUnit } from './modules/unit'
import { registerSales } from './modules/sales'
import { registerChannel } from './modules/channel'
import { registerBranch } from './modules/branch'
import { registerDepartment } from './modules/department'
import { registerWarehouse } from './modules/warehouse'
import { registerAccountGroup } from './modules/account-group'
import { registerSubAccount } from './modules/sub-account'
import { registerAccount } from './modules/account'
import { registerSalesType } from './modules/sales-type'
import { registerPurchaseType } from './modules/purchase-type'
import { registerPaymentType } from './modules/payment-type'
import { registerProduct } from './modules/product'
import { registerSupplier } from './modules/supplier'
import { registerCustomer } from './modules/customer'
import { registerJournal } from './modules/journal'
import { registerJournalExpense } from './modules/journal-expense'
import { registerJournalIncome } from './modules/journal-income'
import { registerCashAdvance } from './modules/cash-advance'
import { registerCashPosition } from './modules/cash-position'
import { registerDashboard } from './modules/dashboard'
import { registerCashFlow } from './modules/cash-flow'

// One entry point for all mocking. Register a new module here; keep its
// handlers in src/mocks/modules/<module>.ts and its contract in docs/<module>/.
const modules = [
	registerAuth,
	registerCompany,
	registerBrand,
	registerProductCategory,
	registerUnit,
	registerSales,
	registerChannel,
	registerBranch,
	registerDepartment,
	registerWarehouse,
	registerAccountGroup,
	registerSubAccount,
	registerAccount,
	registerSalesType,
	registerPurchaseType,
	registerPaymentType,
	registerProduct,
	registerSupplier,
	registerCustomer,
	registerJournal,
	registerJournalExpense,
	registerJournalIncome,
	registerCashAdvance,
	registerCashPosition,
	registerDashboard,
	registerCashFlow
]

// Dev-only. Attaches an adapter to the real `api` instance so production code
// is identical once the backend is live — flip VITE_USE_MOCK=false to remove it.
export function startMock() {
	const mock = new MockAdapter(api, { delayResponse: 250 })
	modules.forEach((register) => register(mock))
	// eslint-disable-next-line no-console
	console.info('%c[mock] API mocking enabled', 'color:#0E7C6B')
}
