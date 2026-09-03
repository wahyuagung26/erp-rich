import type { RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import dashboard from './dashboard'
import akun from './akun'
import jurnal from './jurnal'

const routes: RouteRecordRaw[] = [
	{ path: '/', redirect: '/dashboard' },
	{
		path: '/',
		component: DefaultLayout,
		children: [
			...dashboard,
			...akun,
			...jurnal,
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
