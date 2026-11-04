import type { RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import dashboard from './dashboard'
import company from './company'
import brand from './brand'
import productCategory from './product-category'
import unit from './unit'
import sales from './sales'
import channel from './channel'
import branch from './branch'
import department from './department'
import warehouse from './warehouse'
import salesType from './sales-type'
import purchaseType from './purchase-type'
import paymentType from './payment-type'
import salesExpense from './sales-expense'
import bankAccount from './bank-account'
import product from './product'
import productPrice from './product-price'
import accountGroup from './account-group'
import subAccount from './sub-account'
import account from './account'
import supplier from './supplier'
import customer from './customer'
import journal from './journal'
import journalExpense from './journal-expense'
import journalIncome from './journal-income'
import cashAdvance from './cash-advance'
import supplierAdvance from './supplier-advance'
import cashPosition from './cash-position'
import purchaseOrder from './purchase-order'
import purchaseReceipt from './purchase-receipt'

const routes: RouteRecordRaw[] = [
	{ path: '/', redirect: '/dashboard' },
	{
		path: '/',
		component: DefaultLayout,
		children: [
			...dashboard,
			...company,
			...brand,
			...productCategory,
			...unit,
			...sales,
			...channel,
			...branch,
			...department,
			...warehouse,
			...salesType,
			...purchaseType,
			...paymentType,
			...salesExpense,
			...bankAccount,
			...product,
			...productPrice,
			...accountGroup,
			...subAccount,
			...account,
			...supplier,
			...customer,
			...journal,
			...journalExpense,
			...journalIncome,
			...cashAdvance,
			...supplierAdvance,
			...cashPosition,
			...purchaseOrder,
			...purchaseReceipt,
			{
				path: '/design-system',
				name: 'DesignSystem',
				component: () => import('@/views/design-system/index.vue'),
				meta: { auth: true, breadcrumb: 'Design System' }
			}
		]
	},
	// Full-screen print view (no app shell) — opened in a new tab from the detail page.
	{
		path: '/cash-advance/:id/cetak',
		name: 'CashAdvancePrint',
		component: () => import('@/views/cash-advance/pages/PageCashAdvancePrint.vue'),
		meta: { auth: true }
	},
	{
		path: '/cash-advance/:id/settlement/:settlementId/cetak',
		name: 'CashAdvanceSettlementPrint',
		component: () => import('@/views/cash-advance/pages/PageCashAdvanceSettlementPrint.vue'),
		meta: { auth: true }
	},
	{ path: '/journal/:id/cetak', name: 'JournalPrint', component: () => import('@/views/journal/pages/PageJournalPrint.vue'), meta: { auth: true } },
	{
		path: '/journal-expense/:id/cetak',
		name: 'JournalExpensePrint',
		component: () => import('@/views/journal-expense/pages/PageJournalExpensePrint.vue'),
		meta: { auth: true }
	},
	{
		path: '/journal-income/:id/cetak',
		name: 'JournalIncomePrint',
		component: () => import('@/views/journal-income/pages/PageJournalIncomePrint.vue'),
		meta: { auth: true }
	},
	{ path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
	{ path: '/403', name: 'Forbidden', component: () => import('@/views/ForbiddenView.vue') },
	{ path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue') }
]

export default routes
