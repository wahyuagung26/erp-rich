import type { User } from '@/stores/user'

// Demo credentials for the prototype login.
export const demoCredential = {
	usernames: ['admin@rahadhyan.co.id', 'admin'],
	password: 'password'
}

export const demoUser: User = {
	id: 1,
	name: 'Sri Wahyuni',
	email: 'admin@rahadhyan.co.id',
	roles: [{ name: 'Finance Admin' }]
}
