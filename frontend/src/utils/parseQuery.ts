// Coerce numeric-looking query values to Number, leave the rest as-is.
export function parseQuery(query: Record<string, unknown>): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(query).map(([key, value]) => {
			if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
				return [key, Number(value)]
			}
			return [key, value]
		})
	)
}
