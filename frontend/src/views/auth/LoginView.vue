<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IconUser, IconEye, IconEyeOff, IconAlertCircle } from '@tabler/icons-vue'
import Button from '@/components/base/Button.vue'
import FormField from '@/components/base/FormField.vue'
import Input from '@/components/base/Input.vue'
import { useUserStore } from '@/stores/user'
import BrandIllustration from './BrandIllustration.vue'

// Login v2 — same split-screen layout as the legacy ERP login
// (ERP-FUSIDIGITAL/application/views/login/login.php), rebuilt on the v2 stack
// with the design-system components. The navy brand panel is the one carry-over
// of the legacy chrome (Rahadhyan brand identity).

const user = useUserStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ username: '', password: '' })
const showPassword = ref(false)
const error = ref('')

async function submit() {
	error.value = ''
	try {
		await user.login(form)
		router.replace((route.query.redirect as string) || '/dashboard')
	} catch (e) {
		const res = (e as { response?: { data?: { message?: string } } }).response
		error.value = res?.data?.message || 'Gagal masuk. Coba lagi.'
	}
}
</script>

<template>
	<div class="flex min-h-screen">
		<!-- brand panel -->
		<section class="brand-bg relative hidden flex-1 flex-col items-center justify-center p-10 text-center text-white md:flex">
			<BrandIllustration class="mb-9" />
			<h2 class="text-[2rem] font-semibold tracking-[0.5px]">Rahadhyan International</h2>
			<p class="mt-3 max-w-[460px] text-[15px] leading-[1.7] text-white/70">
				Sistem ERP terintegrasi untuk pembelian, penjualan, persediaan, dan akuntansi.
			</p>
		</section>

		<!-- form panel -->
		<section class="flex w-full shrink-0 flex-col justify-center bg-panel px-9 py-10 md:w-[min(640px,40%)] md:border-l md:border-hairline">
			<div class="mx-auto w-full max-w-[400px] rounded-md border border-hairline bg-panel px-7 py-8 shadow-overlay">
				<div class="mb-6 flex justify-center">
					<svg width="88" height="88" viewBox="0 0 88 88" aria-label="Rahadhyan International">
						<rect width="88" height="88" rx="14" fill="#121925" />
						<circle cx="44" cy="35" r="15" fill="none" stroke="#d4a04a" stroke-width="2.5" />
						<circle cx="44" cy="35" r="8" fill="none" stroke="#d4a04a" stroke-width="2" />
						<circle cx="44" cy="35" r="2.6" fill="#d4a04a" />
						<path d="M44 16v6M44 48v6M25 35h6M57 35h6" stroke="#d4a04a" stroke-width="2" stroke-linecap="round" />
						<text x="44" y="66" text-anchor="middle" fill="#d4a04a" font-size="8.5" font-weight="700" letter-spacing="0.5">RAHADHYAN</text>
						<text x="44" y="76" text-anchor="middle" fill="#d4a04a" font-size="6" letter-spacing="1.5">INTERNATIONAL</text>
					</svg>
				</div>

				<h1 class="text-center text-heading-s font-semibold text-ink">Selamat Datang</h1>
				<p class="mb-6 mt-1 text-center text-s text-ink-muted">Masuk untuk melanjutkan ke ERP</p>

				<div v-if="error" class="mb-4 flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-s text-danger" role="alert">
					<IconAlertCircle class="mt-px h-4 w-4 shrink-0" />
					<span>{{ error }}</span>
				</div>

				<form class="space-y-4" @submit.prevent="submit">
					<FormField label="Username / Email">
						<Input id="username" v-model="form.username" autocomplete="username" autofocus placeholder="Username / Email">
							<template #suffix><IconUser class="h-4 w-4" /></template>
						</Input>
					</FormField>

					<FormField label="Password">
						<Input
							id="password"
							v-model="form.password"
							:type="showPassword ? 'text' : 'password'"
							autocomplete="current-password"
							placeholder="Password"
						>
							<template #suffix>
								<button
									type="button"
									tabindex="-1"
									:aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
									class="grid h-6 w-6 place-items-center rounded hover:text-ink"
									@click="showPassword = !showPassword"
								>
									<IconEyeOff v-if="showPassword" class="h-4 w-4" />
									<IconEye v-else class="h-4 w-4" />
								</button>
							</template>
						</Input>
					</FormField>

					<Button type="submit" block :loading="user.loading" class="!mt-6">
						{{ user.loading ? 'Memproses…' : 'Masuk' }}
					</Button>
				</form>

				<p class="mt-5 text-center text-s text-ink-subtle">Versi 1.0</p>
				<p class="mt-1 text-center text-xs text-ink-subtle">Demo: <span class="font-mono">admin</span> / <span class="font-mono">password</span></p>
			</div>
		</section>
	</div>
</template>

<style scoped>
/* legacy brand panel: pure CSS, zero image requests */
.brand-bg {
	background-color: #121925;
	background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px), linear-gradient(135deg, #17212e 0%, #22364d 45%, #224665 100%);
	background-size:
		22px 22px,
		auto;
}
</style>
