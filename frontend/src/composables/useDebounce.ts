// Shared delay for keyword search inputs (list filters, AsyncSelect, ReferencePicker).
export const SEARCH_DEBOUNCE_MS = 400

// Debounce a callback. Returns a stable wrapper.
export function useDebounce<A extends unknown[]>(fn: (...args: A) => void, wait = SEARCH_DEBOUNCE_MS) {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: A) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => fn(...args), wait)
	}
}
