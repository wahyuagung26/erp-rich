import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

const idr = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

// Money for the numeric spine: negatives in parentheses, no currency symbol
// (the column header carries "Rp"). Returns a plain string.
export function money(value: number | null | undefined): string {
	const n = Number(value ?? 0)
	if (n < 0) return `(${idr.format(Math.abs(n))})`
	return idr.format(n)
}

export function number(value: number | null | undefined): string {
	return idr.format(Number(value ?? 0))
}

export function integerInput(value: number | null | undefined): string {
	return value == null ? '' : number(value)
}

export function parseIntegerInput(value: string): number {
	const digits = value.replace(/\D/g, '')
	return digits ? Number(digits) : 0
}

export function date(value: string | Date | null | undefined, fmt = 'DD MMM YYYY'): string {
	if (!value) return '-'
	return dayjs(value).format(fmt)
}

export function isNegative(value: number | null | undefined): boolean {
	return Number(value ?? 0) < 0
}

// NPWP as typed: 15 digits → 00.000.000.0-000.000, the 16-digit NIK-based number → 0000-0000-0000-0000; extra digits are dropped.
export function formatNpwp(value: string): string {
	const d = value.replace(/\D/g, '').slice(0, 16)
	if (d.length > 15) return d.replace(/(\d{4})(?=\d)/g, '$1-')
	const groups = [2, 3, 3, 1, 3, 3]
	const seps = ['.', '.', '.', '-', '.']
	let out = ''
	let i = 0
	groups.forEach((n, gi) => {
		const part = d.slice(i, i + n)
		if (!part) return
		out += (gi ? seps[gi - 1] : '') + part
		i += n
	})
	return out
}
