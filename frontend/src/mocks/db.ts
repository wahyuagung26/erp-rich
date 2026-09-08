import { journalSeed } from './fixtures/journal'
import { journalExpenseSeed } from './fixtures/journal-expense'
import { journalIncomeSeed } from './fixtures/journal-income'
import { cashAdvanceSeed, cashAdvanceSettlementSeed } from './fixtures/cash-advance'
import { supplierAdvanceSeed, supplierAdvanceUsageSeed } from './fixtures/supplier-advance'
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
import { purchaseOrderSeed } from './fixtures/purchase-order'
import { cashFlowSeed } from './fixtures/cash-flow'
import type {
	Journal,
	JournalExpense,
	JournalIncome,
	CashAdvance,
	CashAdvanceSettlement,
	SupplierAdvance,
	SupplierAdvanceUsage,
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
	PurchaseOrder,
	CashFlow
} from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: {
	journal: Journal[]
	journalExpense: JournalExpense[]
	journalIncome: JournalIncome[]
	cashAdvance: CashAdvance[]
	cashAdvanceSettlement: CashAdvanceSettlement[]
	supplierAdvance: SupplierAdvance[]
	supplierAdvanceUsage: SupplierAdvanceUsage[]
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
	purchaseOrder: PurchaseOrder[]
	cashFlow: CashFlow[]
} = {
	journal: structuredClone(journalSeed),
	journalExpense: structuredClone(journalExpenseSeed),
	journalIncome: structuredClone(journalIncomeSeed),
	cashAdvance: structuredClone(cashAdvanceSeed),
	cashAdvanceSettlement: structuredClone(cashAdvanceSettlementSeed),
	supplierAdvance: structuredClone(supplierAdvanceSeed),
	supplierAdvanceUsage: structuredClone(supplierAdvanceUsageSeed),
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
	purchaseOrder: structuredClone(purchaseOrderSeed),
	cashFlow: structuredClone(cashFlowSeed)
}
