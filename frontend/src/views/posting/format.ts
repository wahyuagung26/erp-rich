import dayjs from 'dayjs'

// 'YYYY-MM' -> 'Agustus 2026'
export const periodLabel = (p: string | null | undefined) => (p ? dayjs(`${p}-01`).format('MMMM YYYY') : '-')

export const addMonths = (p: string, n: number) => dayjs(`${p}-01`).add(n, 'month').format('YYYY-MM')
