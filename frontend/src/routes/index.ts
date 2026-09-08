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
			{
				path: '/design-system',
				name: 'DesignSystem',
				component: () => import('@/views/design-system/index.vue'),
				meta: { auth: true, breadcrumb: 'Design System' }
			}
		]
	},
	{ path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
	{ path: '/403', name: 'Forbidden', component: () => import('@/views/ForbiddenView.vue') },
	{ path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue') }
]

export default routes
