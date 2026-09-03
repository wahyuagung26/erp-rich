import { useUserStore } from '@/stores/user'

// Finance ERP roles. Route meta.roles is checked against these names.
export const ROLES = {
	FINANCE_ADMIN: 'Finance Admin',
	ACCOUNTANT: 'Accountant',
	VIEWER: 'Viewer'
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]

export const ALL_ROLES: RoleName[] = Object.values(ROLES)

// True if the current user holds any of the given roles (empty = allow all).
export function hasPermission(roles?: RoleName[]): boolean {
	const user = useUserStore()
	return user.hasAnyRole(roles ?? [])
}
