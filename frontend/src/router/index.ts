import { createRouter, createWebHistory } from 'vue-router'
import routes from '@/routes'
import { useUserStore } from '@/stores/user'
import type { RoleName } from '@/constant/roles'

declare module 'vue-router' {
	interface RouteMeta {
		auth?: boolean
		roles?: RoleName[]
		breadcrumb?: string
	}
}

const router = createRouter({
	history: createWebHistory(),
	routes,
	scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
	const user = useUserStore()

	if (to.name === 'Login') return user.isAuthenticated ? { path: '/dashboard' } : true
	if (!to.meta.auth) return true

	if (!user.isAuthenticated) return { name: 'Login', query: { redirect: to.fullPath } }
	if (to.meta.roles && !user.hasAnyRole(to.meta.roles)) return { name: 'Forbidden' }
	return true
})

export default router
