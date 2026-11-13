import { budgetSeed, revisionSeed, budgetPeriodSeed } from './fixtures/budgeting'
import type { BudgetDocument, RevisionPeriod } from '@/views/budgeting/types'
import { journalSeed } from './fixtures/journal'
import { journalExpenseSeed } from './fixtures/journal-expense'
import { journalIncomeSeed } from './fixtures/journal-income'
import { cashAdvanceSeed, cashAdvanceSettlementSeed } from './fixtures/cash-advance'
import { supplierAdvanceSeed, supplierAdvanceUsageSeed } from './fixtures/supplier-advance'
import { customerDepositSeed, customerDepositUsageSeed } from './fixtures/customer-deposit'
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
import { salesExpenseSeed } from './fixtures/sales-expense'
import { bankAccountSeed } from './fixtures/bank-account'
import { productSeed } from './fixtures/product'
import { purchaseOrderSeed } from './fixtures/purchase-order'
import { salesOrderSeed, type SalesOrderRow } from './fixtures/sales-order'
import { salesInvoiceSeed, salesInvoicePaymentSeed, type SalesInvoiceRow } from './fixtures/sales-invoice'
import { deliveryNoteSeed, type DeliveryNoteRow } from './fixtures/delivery-note'
import {
	salesReturnSeed,
	salesReturnSettlementSeed,
	salesReturnPaymentSeed,
	type SalesReturnRow,
	type SalesReturnSettlementRow
} from './fixtures/sales-return'
import { purchaseReceiptSeed } from './fixtures/purchase-receipt'
import { purchaseInvoiceSeed } from './fixtures/purchase-invoice'
import { purchaseReturnSeed, purchaseReturnSettlementSeed, type PurchaseReturnSettlementRow } from './fixtures/purchase-return'
import { supplierPayablePaymentSeed, type SupplierPayablePaymentRow } from './fixtures/supplier-payable'
import { cashFlowSeed } from './fixtures/cash-flow'
import { historySeed } from './fixtures/history'
import type { PostingState } from './fixtures/posting'
import type { OutlookStore } from './fixtures/outlook'
import type {
	Journal,
	JournalExpense,
	JournalIncome,
	CashAdvance,
	CashAdvanceSettlement,
	SupplierAdvance,
	SupplierAdvanceUsage,
	CustomerDeposit,
	CustomerDepositUsage,
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
	SalesExpense,
	BankAccount,
	Product,
	PurchaseOrder,
	PurchaseReceipt,
	PurchaseInvoice,
	SalesInvoicePayment,
	PurchaseReturn,
	CashFlow,
	HistoryEvent
} from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: {
	budget: BudgetDocument[]
	budgetRevision: BudgetDocument[]
	budgetPeriod: Record<number, RevisionPeriod>
	journal: Journal[]
	journalExpense: JournalExpense[]
	journalIncome: JournalIncome[]
	cashAdvance: CashAdvance[]
	cashAdvanceSettlement: CashAdvanceSettlement[]
	supplierAdvance: SupplierAdvance[]
	supplierAdvanceUsage: SupplierAdvanceUsage[]
	customerDeposit: CustomerDeposit[]
	customerDepositUsage: CustomerDepositUsage[]
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
	salesExpense: SalesExpense[]
	bankAccount: BankAccount[]
	product: Product[]
	purchaseOrder: PurchaseOrder[]
	salesOrder: SalesOrderRow[] // invoice link is derived from salesInvoice.sales_order_id (1 SO <-> 1 invoice), see docs/sales-order/index.md
	salesInvoice: SalesInvoiceRow[]
	salesInvoicePayment: SalesInvoicePayment[] // paid_total / outstanding are always recomputed from ALL rows of an invoice, see docs/sales-invoice/index.md
	deliveryNote: DeliveryNoteRow[] // Surat Jalan: at most one per sales invoice, see docs/delivery-note/index.md
	salesReturn: SalesReturnRow[] // Retur Penjualan; tax_invoice is also written by Import Faktur Pajak, see docs/sales-return/index.md
	salesReturnSettlement: SalesReturnSettlementRow[] // a receivable_deduction owns one kind:'receivable' row (return_id) of salesInvoicePayment
	purchaseReceipt: PurchaseReceipt[]
	purchaseInvoice: PurchaseInvoice[]
	purchaseReturn: Omit<PurchaseReturn, 'used_total' | 'refunded_total' | 'remaining_total' | 'settlement_status' | 'settlements'>[]
	purchaseReturnSettlement: PurchaseReturnSettlementRow[]
	supplierPayablePayment: SupplierPayablePaymentRow[]
	cashFlow: CashFlow[]
	history: Record<string, HistoryEvent[]> // `<resource>:<id>` → timeline, see mocks/history.ts
	posting: Record<number, PostingState> // lazily seeded per company, see mocks/modules/posting.ts
	outlook: Record<number, OutlookStore> // lazily seeded per company, see mocks/modules/outlook.ts
} = {
	budget: budgetSeed,
	budgetRevision: revisionSeed,
	budgetPeriod: budgetPeriodSeed,
	journal: structuredClone(journalSeed),
	journalExpense: structuredClone(journalExpenseSeed),
	journalIncome: structuredClone(journalIncomeSeed),
	cashAdvance: structuredClone(cashAdvanceSeed),
	cashAdvanceSettlement: structuredClone(cashAdvanceSettlementSeed),
	supplierAdvance: structuredClone(supplierAdvanceSeed),
	supplierAdvanceUsage: structuredClone(supplierAdvanceUsageSeed),
	customerDeposit: structuredClone(customerDepositSeed),
	customerDepositUsage: structuredClone(customerDepositUsageSeed),
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
	salesExpense: structuredClone(salesExpenseSeed),
	bankAccount: structuredClone(bankAccountSeed),
	product: structuredClone(productSeed),
	purchaseOrder: structuredClone(purchaseOrderSeed),
	salesOrder: structuredClone(salesOrderSeed),
	salesInvoice: structuredClone(salesInvoiceSeed),
	salesInvoicePayment: structuredClone([...salesInvoicePaymentSeed, ...salesReturnPaymentSeed]),
	salesReturn: structuredClone(salesReturnSeed),
	salesReturnSettlement: structuredClone(salesReturnSettlementSeed),
	deliveryNote: structuredClone(deliveryNoteSeed),
	purchaseReceipt: structuredClone(purchaseReceiptSeed),
	purchaseInvoice: structuredClone(purchaseInvoiceSeed),
	purchaseReturn: structuredClone(purchaseReturnSeed),
	purchaseReturnSettlement: structuredClone(purchaseReturnSettlementSeed),
	supplierPayablePayment: structuredClone(supplierPayablePaymentSeed),
	cashFlow: structuredClone(cashFlowSeed),
	history: structuredClone(historySeed),
	posting: {},
	outlook: {}
}
