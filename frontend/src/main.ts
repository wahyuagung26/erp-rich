import '@/assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useUiStore } from './stores/ui'

async function bootstrap() {
	if (import.meta.env.VITE_USE_MOCK === 'true') {
		const { startMock } = await import('./mocks')
		startMock()
	}

	const app = createApp(App)
	app.use(createPinia())
	app.use(router)
	const ui = useUiStore()
	ui.setFeel(ui.feel) // apply saved feel before first paint
	app.mount('#app')
}

bootstrap()
