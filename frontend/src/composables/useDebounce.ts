// Debounce a callback. Returns a stable wrapper.
export function useDebounce<A extends unknown[]>(fn: (...args: A) => void, wait = 250) {
	let timer: ReturnType<typeof setTimeout> | null = null
	return (...args: A) => {
		if (timer) clearTimeout(timer)
		timer = setTimeout(() => fn(...args), wait)
	}
}
