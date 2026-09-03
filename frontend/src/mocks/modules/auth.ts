import type MockAdapter from 'axios-mock-adapter'
import { demoCredential, demoUser } from '../fixtures/auth'

// Contract: docs/auth/
export function registerAuth(mock: MockAdapter) {
	mock.onPost('/auth/login').reply((config) => {
		const { username, password } = JSON.parse(config.data || '{}') as { username?: string; password?: string }

		if (!username || !password) {
			return [422, { message: 'Data tidak lengkap', errors: { password: !password ? ['Password wajib diisi'] : [] } }]
		}
		const ok = demoCredential.usernames.includes(username.trim().toLowerCase()) && password === demoCredential.password
		if (!ok) return [401, { message: 'Username atau password salah' }]

		return [200, { data: { token: 'mock.eyJ1IjoidS0xIn0', user: demoUser }, message: 'Berhasil masuk' }]
	})
}
