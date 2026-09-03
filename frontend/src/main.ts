import '@/assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

async function bootstrap() {
	if (import.meta.env.VITE_USE_MOCK === 'true') {
		const { startMock } = await import('./mocks')
		startMock()
	}

	const app = createApp(App)
	app.use(createPinia())
	app.use(router)
	app.mount('#app')
}

bootstrap()
