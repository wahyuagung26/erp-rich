import { journalSeed } from './fixtures/journal'
import { supplierSeed } from './fixtures/supplier'
import { customerSeed } from './fixtures/customer'
import { companySeed } from './fixtures/company'
import { brandSeed } from './fixtures/brand'
import { productCategorySeed } from './fixtures/product-category'
import { unitSeed } from './fixtures/unit'
import { branchSeed } from './fixtures/branch'
import { departmentSeed } from './fixtures/department'
import { warehouseSeed } from './fixtures/warehouse'
import { accountGroupSeed } from './fixtures/account-group'
import { subAccountSeed } from './fixtures/sub-account'
import { accountSeed } from './fixtures/account'
import { salesTypeSeed } from './fixtures/sales-type'
import { paymentTypeSeed } from './fixtures/payment-type'
import type {
	Journal,
	Supplier,
	Customer,
	Company,
	Brand,
	ProductCategory,
	Unit,
	Branch,
	Department,
	Warehouse,
	AccountGroup,
	SubAccount,
	Account,
	SalesType,
	PaymentType
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
	branch: Branch[]
	department: Department[]
	warehouse: Warehouse[]
	accountGroup: AccountGroup[]
	subAccount: SubAccount[]
	account: Account[]
	salesType: SalesType[]
	paymentType: PaymentType[]
} = {
	journal: structuredClone(journalSeed),
	supplier: structuredClone(supplierSeed),
	customer: structuredClone(customerSeed),
	company: structuredClone(companySeed),
	brand: structuredClone(brandSeed),
	productCategory: structuredClone(productCategorySeed),
	unit: structuredClone(unitSeed),
	branch: structuredClone(branchSeed),
	department: structuredClone(departmentSeed),
	warehouse: structuredClone(warehouseSeed),
	accountGroup: structuredClone(accountGroupSeed),
	subAccount: structuredClone(subAccountSeed),
	account: structuredClone(accountSeed),
	salesType: structuredClone(salesTypeSeed),
	paymentType: structuredClone(paymentTypeSeed)
}
