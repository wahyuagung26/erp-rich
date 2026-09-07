import { journalSeed } from './fixtures/journal'
import { supplierSeed } from './fixtures/supplier'
import { customerSeed } from './fixtures/customer'
import { companySeed } from './fixtures/company'
import { brandSeed } from './fixtures/brand'
import { productCategorySeed } from './fixtures/product-category'
import { unitSeed } from './fixtures/unit'
import { salesSeed } from './fixtures/sales'
import { channelSeed } from './fixtures/channel'
import { branchSeed } from './fixtures/branch'
import { departmentSeed } from './fixtures/department'
import { warehouseSeed } from './fixtures/warehouse'
import { accountGroupSeed } from './fixtures/account-group'
import { subAccountSeed } from './fixtures/sub-account'
import { accountSeed } from './fixtures/account'
import { salesTypeSeed } from './fixtures/sales-type'
import { purchaseTypeSeed } from './fixtures/purchase-type'
import { paymentTypeSeed } from './fixtures/payment-type'
import { productSeed } from './fixtures/product'
import { cashFlowSeed } from './fixtures/cash-flow'
import type {
	Journal,
	Supplier,
	Customer,
	Company,
	Brand,
	ProductCategory,
	Unit,
	Sales,
	Channel,
	Branch,
	Department,
	Warehouse,
	AccountGroup,
	SubAccount,
	Account,
	SalesType,
	PurchaseType,
	PaymentType,
	Product,
	CashFlow
} from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: {
	journal: Journal[]
	supplier: Supplier[]
	customer: Customer[]
	company: Company[]
	brand: Brand[]
	productCategory: ProductCategory[]
	unit: Unit[]
	sales: Sales[]
	channel: Channel[]
	branch: Branch[]
	department: Department[]
	warehouse: Warehouse[]
	accountGroup: AccountGroup[]
	subAccount: SubAccount[]
	account: Account[]
	salesType: SalesType[]
	purchaseType: PurchaseType[]
	paymentType: PaymentType[]
	product: Product[]
	cashFlow: CashFlow[]
} = {
	journal: structuredClone(journalSeed),
	supplier: structuredClone(supplierSeed),
	customer: structuredClone(customerSeed),
	company: structuredClone(companySeed),
	brand: structuredClone(brandSeed),
	productCategory: structuredClone(productCategorySeed),
	unit: structuredClone(unitSeed),
	sales: structuredClone(salesSeed),
	channel: structuredClone(channelSeed),
	branch: structuredClone(branchSeed),
	department: structuredClone(departmentSeed),
	warehouse: structuredClone(warehouseSeed),
	accountGroup: structuredClone(accountGroupSeed),
	subAccount: structuredClone(subAccountSeed),
	account: structuredClone(accountSeed),
	salesType: structuredClone(salesTypeSeed),
	purchaseType: structuredClone(purchaseTypeSeed),
	paymentType: structuredClone(paymentTypeSeed),
	product: structuredClone(productSeed),
	cashFlow: structuredClone(cashFlowSeed)
}
