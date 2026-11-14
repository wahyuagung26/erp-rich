// Contract: docs/auth/login.md. Username is lowercased but not trimmed (the TS mock trims). Mirrors frontend/src/mocks/modules/auth.ts. No data bucket; no real token (opaque string).
import { resp, route, when, json } from '../lib.mjs'
import { demoCredential, demoUser } from '../../frontend/src/mocks/fixtures/auth.ts'

// `body` returns a SafeString (always truthy in {{#if}}) and `includes` only works on strings, so normalise with
// concat and compare with eq.
const field = (name) => `(concat (body '${name}'))`
const missingField = `{{#if ${field('username')}}}{{#if ${field('password')}}}false{{else}}true{{/if}}{{else}}true{{/if}}`
const knownUser = demoCredential.usernames.reduceRight((rest, u) => `{{#if (eq (lowercase ${field('username')}) '${u}')}}false{{else}}${rest}{{/if}}`, 'true')
const badCredentials = `{{#if (eq ${field('password')} '${demoCredential.password}')}}${knownUser}{{else}}true{{/if}}`

export const data = {}

export const routes = [
	route('post', 'auth/login', 'Login', [
		resp('auth-login-422', {
			status: 422,
			label: 'Incomplete',
			rules: [when(missingField)],
			body: `{"message": "Data tidak lengkap", "errors": {"password": {{#if ${field('password')}}}[]{{else}}["Password wajib diisi"]{{/if}} }}`
		}),
		resp('auth-login-401', { status: 401, label: 'Bad credentials', rules: [when(badCredentials)], body: json({ message: 'Username atau password salah' }) }),
		resp('auth-login', {
			label: 'Logged in',
			isDefault: true,
			body: json({ data: { token: 'mock.eyJ1IjoidS0xIn0', user: demoUser }, message: 'Berhasil masuk' })
		})
	])
]
