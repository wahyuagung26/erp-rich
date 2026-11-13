import { defineAsyncComponent, defineComponent, h, type Component } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const formPage = defineAsyncComponent(() => import('@/views/budgeting/pages/PageBudgetForm.vue'))
const detailPage = defineAsyncComponent(() => import('@/views/budgeting/pages/PageBudgetDetail.vue'))
const page = (component: Component, kind: 'budgets' | 'revisions') =>
	defineComponent({
		setup() {
			const route = useRoute()
			return () => h(component, { kind, key: route.fullPath })
		}
	})

export default [
	{
		path: '/budgeting/budgets',
		meta: { breadcrumb: 'Form Budget' },
		children: [
			{
				path: '',
				name: 'BudgetList',
				component: () => import('@/views/budgeting/pages/PageBudgetList.vue'),
				meta: { auth: true }
			},
			{
				path: 'import',
				name: 'BudgetImport',
				component: () => import('@/views/budgeting/pages/PageBudgetImport.vue'),
				meta: { auth: true, breadcrumb: 'Import Multi-Departemen' }
			},
			{
				path: 'tambah',
				name: 'BudgetCreate',
				component: page(formPage, 'budgets'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'BudgetEdit',
				component: page(formPage, 'budgets'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'BudgetDetail',
				component: page(detailPage, 'budgets'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	},
	{
		path: '/budgeting/revisions',
		meta: { breadcrumb: 'Revisi Budget' },
		children: [
			{
				path: '',
				name: 'BudgetRevisionList',
				component: () => import('@/views/budgeting/pages/PageRevisionList.vue'),
				meta: { auth: true }
			},
			{
				path: 'tambah',
				name: 'BudgetRevisionCreate',
				component: page(formPage, 'revisions'),
				meta: { auth: true, breadcrumb: 'Tambah' }
			},
			{
				path: 'edit/:id',
				name: 'BudgetRevisionEdit',
				component: page(formPage, 'revisions'),
				meta: { auth: true, breadcrumb: 'Edit' }
			},
			{
				path: ':id',
				name: 'BudgetRevisionDetail',
				component: page(detailPage, 'revisions'),
				meta: { auth: true, breadcrumb: 'Detail' }
			}
		]
	},
	{
		path: '/budgeting/realization',
		name: 'BudgetRealization',
		component: () => import('@/views/budgeting/pages/PageRealization.vue'),
		meta: { auth: true, breadcrumb: 'Realisasi Budget' }
	},
	{
		path: '/budgeting/period',
		name: 'BudgetPeriod',
		component: () => import('@/views/budgeting/pages/PageRevisionPeriod.vue'),
		meta: { auth: true, breadcrumb: 'Periode Revisi' }
	}
] satisfies RouteRecordRaw[]
