// Company brand colour → design-token CSS variables (primary / primary-dark / primary-soft / success*).
// Derived in OKLCH so shades stay perceptually even; primary is darkened until white text reads (WCAG AA).

export const DEFAULT_BRAND = '#0E7C6B'
const MIN_CONTRAST = 4.6 // WCAG AA is 4.5 (white on primary); +0.1 margin absorbs 8-bit rounding

type Rgb = [number, number, number] // linear sRGB 0..1

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGamma = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)
const clamp = (n: number) => Math.min(1, Math.max(0, n))

function hexToLinear(hex: string): Rgb {
	const n = parseInt(hex.slice(1), 16)
	return [toLinear(((n >> 16) & 255) / 255), toLinear(((n >> 8) & 255) / 255), toLinear((n & 255) / 255)]
}

function linearToOklch([r, g, b]: Rgb): [number, number, number] {
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
	const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
	const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
	const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
	return [L, Math.hypot(a, bb), (Math.atan2(bb, a) * 180) / Math.PI]
}

// Out-of-gamut results are clamped per channel — fine for UI shades.
function oklchToLinear(L: number, C: number, H: number): Rgb {
	const a = C * Math.cos((H * Math.PI) / 180)
	const b = C * Math.sin((H * Math.PI) / 180)
	const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
	const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
	const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
	return [
		clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
		clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
		clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
	]
}

// "r g b" 0-255 channels, the format tokens.css uses.
const channels = (rgb: Rgb) => rgb.map((c) => Math.round(toGamma(c) * 255)).join(' ')

const contrastOnWhite = ([r, g, b]: Rgb) => 1.05 / (0.2126 * r + 0.7152 * g + 0.0722 * b + 0.05)

const ROOT_VARS = ['--c-primary', '--c-primary-dark', '--c-primary-soft', '--c-success', '--c-success-soft']

export function applyBrand(hex?: string | null) {
	const root = document.documentElement.style
	if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) return resetBrand()

	let [L, C, H] = linearToOklch(hexToLinear(hex))
	let primary = oklchToLinear(L, C, H)
	while (contrastOnWhite(primary) < MIN_CONTRAST && L > 0.2) {
		L -= 0.01
		primary = oklchToLinear(L, C, H)
	}
	const dark = channels(oklchToLinear(Math.max(L - 0.08, 0.15), C, H))
	const soft = channels(oklchToLinear(0.95, Math.min(C, 0.2) * 0.2, H))

	root.setProperty('--c-primary', channels(primary))
	root.setProperty('--c-primary-dark', dark)
	root.setProperty('--c-primary-soft', soft)
	// success deliberately follows the brand (owner decision 2026-11-05)
	root.setProperty('--c-success', channels(primary))
	root.setProperty('--c-success-soft', soft)
}

// Back to the tokens.css defaults (login page, logout, company without a colour).
export function resetBrand() {
	ROOT_VARS.forEach((v) => document.documentElement.style.removeProperty(v))
}
