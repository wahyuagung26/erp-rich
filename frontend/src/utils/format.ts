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

export function date(value: string | Date | null | undefined, fmt = 'DD MMM YYYY'): string {
	if (!value) return '-'
	return dayjs(value).format(fmt)
}

export function isNegative(value: number | null | undefined): boolean {
	return Number(value ?? 0) < 0
}
