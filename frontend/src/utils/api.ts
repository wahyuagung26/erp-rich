import axios from 'axios'
import router from '@/router'

// Single axios instance. Production code never changes when the mock is
// removed — src/mocks attaches an adapter to THIS instance in dev only.
const api = axios.create({
	baseURL: import.meta.env.VITE_APP_API_URL,
	headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	if (token) config.headers.Authorization = `Bearer ${token}`
	// Company-scoped resources (supplier/customer/brand) read this in the mock — see docs/conventions.md#company-scoping
	const companyId = localStorage.getItem('company.activeId')
	if (companyId) config.headers['X-Company-Id'] = companyId
	return config
})

api.interceptors.response.use(
	(response) => response,
	(error) => {
		// 401 on a non-login request → session expired
		if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
			localStorage.removeItem('token')
			localStorage.removeItem('user')
			if (router.currentRoute.value.name !== 'Login') router.replace('/login')
		}
		return Promise.reject(error)
	}
)

export default api
