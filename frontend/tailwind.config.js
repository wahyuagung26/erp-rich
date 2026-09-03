/** @type {import('tailwindcss').Config} */

// Colors read RGB channels from CSS variables (assets/tokens.css) so alpha
// modifiers keep working (bg-primary/10) and a dark theme is a later var swap.
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
	darkMode: 'class',
	content: ['./index.html', './src/**/*.{vue,js,ts}'],
	theme: {
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			white: '#ffffff',
			black: '#000000',
			canvas: rgb('--c-canvas'),
			panel: rgb('--c-panel'),
			hairline: rgb('--c-hairline'),
			fill: rgb('--c-fill'),
			ink: {
				DEFAULT: rgb('--c-ink'),
				muted: rgb('--c-ink-muted'),
				subtle: rgb('--c-ink-subtle'),
				invert: rgb('--c-ink-invert')
			},
			primary: {
				DEFAULT: rgb('--c-primary'),
				dark: rgb('--c-primary-dark'),
				soft: rgb('--c-primary-soft')
			},
			danger: { DEFAULT: rgb('--c-danger'), soft: rgb('--c-danger-soft') },
			warning: { DEFAULT: rgb('--c-warning'), soft: rgb('--c-warning-soft') },
			success: { DEFAULT: rgb('--c-success'), soft: rgb('--c-success-soft') },
			info: { DEFAULT: rgb('--c-info'), soft: rgb('--c-info-soft') }
		},
		fontSize: {
			xs: ['0.625rem', '0.875rem'], // 10
			s: ['0.75rem', '1.125rem'], // 12
			m: ['0.8125rem', '1.25rem'], // 13 — base
			l: ['0.875rem', '1.375rem'], // 14
			'heading-s': ['1rem', '1.5rem'], // 16
			'heading-m': ['1.25rem', '1.75rem'], // 20
			'heading-l': ['1.75rem', '2.25rem'] // 28
		},
		borderRadius: {
			none: '0',
			chip: '4px',
			DEFAULT: '6px',
			md: '6px',
			lg: '6px',
			full: '9999px'
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
			},
			boxShadow: {
				// overlay-only elevation; in-page surfaces stay flat
				overlay: '0 8px 28px -6px rgb(16 24 32 / 0.16), 0 2px 8px -2px rgb(16 24 32 / 0.08)'
			}
		}
	},
	plugins: []
}
