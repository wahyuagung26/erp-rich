import { defineStore } from 'pinia'
import api from '@/utils/api'
import { getDeviceId } from '@/utils/deviceId'

export interface Role {
	name: string
}

export interface User {
	id: number
	name: string
	email: string
	roles: Role[]
}

interface LoginResponse {
	data: { token: string; user: User }
	message?: string
}

// Session restore: if a token survived a reload, treat the user as logged in.
// A real backend would verify via GET /auth/me; the prototype trusts the cached user.
function restoreUser(): User | null {
	if (!localStorage.getItem('token')) return null
	try {
		return JSON.parse(localStorage.getItem('user') || 'null')
	} catch {
		return null
	}
}

export const useUserStore = defineStore('user', {
	state: () => ({
		user: restoreUser(),
		loading: false
	}),
	getters: {
		getUser: (state) => state.user,
		isAuthenticated: (state) => !!state.user,
		roleNames: (state) => state.user?.roles.map((r) => r.name) ?? []
	},
	actions: {
		async login(payload: { username: string; password: string }) {
			this.loading = true
			try {
				const res = await api.post<LoginResponse>('/auth/login', { ...payload, device_id: getDeviceId() })
				localStorage.setItem('token', res.data.data.token)
				localStorage.setItem('user', JSON.stringify(res.data.data.user))
				this.user = res.data.data.user
			} finally {
				this.loading = false
			}
		},
		logout() {
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			this.user = null
		},
		setUser(payload: User) {
			this.user = payload
		},
		hasAnyRole(roles: string[]) {
			if (!roles?.length) return true
			return this.roleNames.some((r) => roles.includes(r))
		}
	}
})
