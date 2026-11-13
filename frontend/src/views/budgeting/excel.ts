import api from '@/utils/api'
import type { ApiList } from '@/utils/types'
import type { SheetData } from 'read-excel-file/browser'
import { codeExample, codePattern, months, sumDocument, type BudgetAccount, type BudgetDocument, type BudgetLine, type RealizationRow } from './types'

const headers = ['Kode Akun', 'Kode Rincian', 'Deskripsi', ...months]
async function allAccounts(): Promise<BudgetAccount[]> {
	const result: BudgetAccount[] = []
	let page = 1
	let last = 1
	do {
		const response = await api.get<ApiList<BudgetAccount>>('/budgeting/accounts', { params: { page, per_page: 100 } })
		result.push(...response.data.data)
		last = response.data.meta.last_page
		page++
	} while (page <= last && page <= 100)
	if (page <= last) throw new Error('Daftar akun terlalu banyak. Persempit data lalu coba lagi.')
	return result
}
export async function downloadTemplate(year: number) {
	const [writer, accounts] = await Promise.all([import('write-excel-file/browser'), allAccounts()])
	await writer
		.default([
			{
				sheet: 'Rincian Budget',
				data: accounts[0]
					? [headers, [accounts[0].code, codeExample(year, accounts[0].prefix), 'Contoh - ganti atau hapus baris ini', ...Array(12).fill(0)]]
					: [headers]
			},
			{
				sheet: 'Daftar Akun',
				data: [['Kode Akun', 'Nama Akun', 'Kelompok', 'Awalan'], ...accounts.map((a) => [a.code, a.name, a.section, a.prefix])]
			}
		])
		.toFile(`template-budget-${year}.xlsx`)
}
export interface ImportRow {
	row: number
	account: string
	code: string
	description: string
	total: number
	status: 'valid' | 'warning' | 'error'
	issues: string[]
	line?: BudgetLine
}
export interface ImportPreview {
	rows: ImportRow[]
	lines: BudgetLine[]
	total: number
}
// Row-level preview like the legacy importer: a bad row is reported and skipped instead of failing the whole file.
export async function previewBudgetFile(file: File, year: number): Promise<ImportPreview> {
	if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 5 * 1024 * 1024) throw new Error('Pilih file XLSX berukuran maksimal 5 MB.')
	const [{ readSheet }, accounts] = await Promise.all([import('read-excel-file/browser'), allAccounts()])
	let rows: SheetData
	try {
		rows = await readSheet(file)
	} catch {
		throw new Error('File tidak dapat dibaca. Gunakan template XLSX terbaru.')
	}
	if (
		!rows.length ||
		headers.some(
			(header, i) =>
				String(rows[0]?.[i] ?? '')
					.trim()
					.toLowerCase() !== header.toLowerCase()
		)
	)
		throw new Error('Kolom template tidak sesuai. Unduh template terbaru lalu coba lagi.')
	if (rows.length > 2001) throw new Error('Maksimal 2.000 rincian dalam satu file.')
	const result: ImportRow[] = []
	const seen = new Set<string>()
	for (const [index, row] of rows.slice(1).entries()) {
		if (row.every((value) => value === null || value === '')) continue
		const accountCode = String(row[0] ?? '').trim()
		const account = accounts.find((item) => item.code === accountCode)
		const code = String(row[1] ?? '')
			.trim()
			.toUpperCase()
		const description = String(row[2] ?? '').trim()
		const amounts = months.map((_, i) => (row[i + 3] === null || row[i + 3] === undefined || row[i + 3] === '' ? 0 : row[i + 3]))
		const issues: string[] = []
		const warnings: string[] = []
		const match = code.length <= 50 ? codePattern.exec(code) : null
		if (!account) issues.push(`Akun ${accountCode || '(kosong)'} tidak tersedia untuk budgeting.`)
		if (!match) issues.push(`Format kode harus AWALAN/OBG${year}/KODE_DEPT/NNN, contoh ${codeExample(year)}.`)
		else {
			if (Number(match[2]) !== year) issues.push(`Tahun pada kode (${match[2]}) tidak sama dengan tahun anggaran (${year}).`)
			if (account && match[1]?.toUpperCase() !== account.prefix)
				issues.push(`Akun ini termasuk ${account.prefix === 'CPX' ? 'CAPEX' : 'OPEX'}, awalan kode harus ${account.prefix}.`)
		}
		if (code && seen.has(code)) issues.push('Kode ganda di file ini.')
		if (!description) issues.push('Deskripsi wajib diisi.')
		if (amounts.some((amount) => typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0))
			issues.push('Nominal harus berupa angka nol atau lebih.')
		else if (amounts.every((amount) => amount === 0)) warnings.push('Semua nominal bulan bernilai 0.')
		if (code) seen.add(code)
		const line =
			account && !issues.length
				? {
						account_id: account.id,
						account_code: account.code,
						account_name: account.name,
						section: account.section,
						prefix: account.prefix,
						sign: account.sign,
						code,
						description,
						months: amounts as number[]
					}
				: undefined
		result.push({
			row: index + 2,
			account: account ? `${account.code} — ${account.name}` : accountCode,
			code,
			description,
			total: amounts.reduce<number>((n, v) => n + (typeof v === 'number' ? v : 0), 0),
			status: issues.length ? 'error' : warnings.length ? 'warning' : 'valid',
			issues: [...issues, ...warnings],
			line
		})
	}
	if (!result.length) throw new Error('File tidak berisi rincian. Isi template lalu coba lagi.')
	const lines = result.flatMap((item) => (item.line ? [item.line] : []))
	return { rows: result, lines, total: sumDocument(lines) }
}
export async function exportDocument(doc: BudgetDocument) {
	const writer = await import('write-excel-file/browser')
	const rows = [
		['Nomor', doc.number],
		['Departemen', doc.department_name],
		['Tahun', doc.year],
		['Status', doc.status],
		[],
		[...headers, 'Total'],
		...doc.lines.map((line) => [line.account_code, line.code, line.description, ...line.months, line.months.reduce((a, b) => a + b, 0)]),
		['Laba Rugi Setelah Belanja Modal', ...Array(14).fill(''), doc.total]
	]
	const sheets = [{ sheet: 'Budget', data: rows }]
	if (doc.initial_lines)
		sheets.push({
			sheet: 'Budget Awal',
			data: [
				[...headers, 'Total'],
				...doc.initial_lines.map((line) => [line.account_code, line.code, line.description, ...line.months, line.months.reduce((a, b) => a + b, 0)])
			]
		})
	await writer.default(sheets).toFile(`${doc.number.replaceAll('/', '-')}.xlsx`)
}
export async function exportRealization(rows: RealizationRow[], year: number, month: number, cutoff: number, ytdRows: RealizationRow[] = rows) {
	const writer = await import('write-excel-file/browser')
	const upto = (values: number[]) => values.slice(0, cutoff).reduce((a, b) => a + b, 0)
	const data = [
		[
			'Kode Akun',
			'Nama Akun',
			'Kelompok',
			`Budget ${months[month - 1]}`,
			`Realisasi ${months[month - 1]}`,
			'Budget YTD',
			'Realisasi YTD',
			'Selisih YTD',
			'Capaian YTD'
		],
		...rows.map((row) => {
			const ytdRow = ytdRows.find((r) => r.account_code === row.account_code)
			const budget = upto(ytdRow?.budget ?? [])
			const actual = upto(ytdRow?.actual ?? [])
			return [
				row.account_code,
				row.account_name,
				row.section,
				row.budget[month - 1] ?? 0,
				row.actual[month - 1] ?? 0,
				budget,
				actual,
				row.sign > 0 ? actual - budget : budget - actual,
				{ value: actual / (budget || 100), format: '0.0%' }
			]
		})
	]
	const monthly = [
		[
			'Kode Akun',
			'Nama Akun',
			'Kelompok',
			...months.flatMap((m) => [`Budget ${m}`, `Realisasi ${m}`, `Selisih ${m}`, `% ${m}`]),
			'Budget Tahun',
			'Realisasi Tahun'
		],
		...rows.map((row) => [
			row.account_code,
			row.account_name,
			row.section,
			...months.flatMap((_, i) => {
				const b = row.budget[i] ?? 0,
					a = row.actual[i] ?? 0
				return [b, a, row.sign > 0 ? a - b : b - a, { value: a / (b || 100), format: '0.0%' }]
			}),
			row.budget.reduce((a, b) => a + b, 0),
			row.actual.reduce((a, b) => a + b, 0)
		])
	]
	await writer
		.default([
			{ sheet: 'Ringkasan', data },
			{ sheet: 'Bulanan', data: monthly }
		])
		.toFile(`realisasi-budget-${year}-${String(month).padStart(2, '0')}.xlsx`)
}

export interface BatchDepartment {
	department_code: string
	lines: BudgetLine[]
}
export interface ImportPreviewItem {
	department_code: string
	department_name: string
	action: 'create' | 'replace' | 'reject'
	number?: string
	errors: string[]
}
const batchHeaders = ['Kode Departemen', ...headers]
export async function downloadBatchTemplate(year: number) {
	const [writer, accounts, departments] = await Promise.all([
		import('write-excel-file/browser'),
		allAccounts(),
		api.get<ApiList<{ code: string; name: string }>>('/department', { params: { page: 1, per_page: 1000 } })
	])
	await writer
		.default([
			{
				sheet: 'Rincian Budget',
				data:
					accounts[0] && departments.data.data[0]
						? [
								batchHeaders,
								[
									departments.data.data[0].code,
									accounts[0].code,
									codeExample(year, accounts[0].prefix),
									'Contoh - ganti atau hapus baris ini',
									...Array(12).fill(0)
								]
							]
						: [batchHeaders]
			},
			{
				sheet: 'Daftar Akun',
				data: [['Kode Akun', 'Nama Akun', 'Kelompok', 'Awalan'], ...accounts.map((a) => [a.code, a.name, a.section, a.prefix])]
			},
			{ sheet: 'Daftar Departemen', data: [['Kode Departemen', 'Nama Departemen'], ...departments.data.data.map((d) => [d.code, d.name])] }
		])
		.toFile(`template-budget-multi-${year}.xlsx`)
}
export async function readBatchFile(file: File): Promise<BatchDepartment[]> {
	if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 5 * 1024 * 1024) throw new Error('Pilih file XLSX berukuran maksimal 5 MB.')
	const [{ readSheet }, accounts] = await Promise.all([import('read-excel-file/browser'), allAccounts()])
	let rows: SheetData
	try {
		rows = await readSheet(file)
	} catch {
		throw new Error('File tidak dapat dibaca. Gunakan template XLSX terbaru.')
	}
	if (
		!rows.length ||
		batchHeaders.some(
			(header, i) =>
				String(rows[0]?.[i] ?? '')
					.trim()
					.toLowerCase() !== header.toLowerCase()
		)
	)
		throw new Error('Kolom template tidak sesuai. Unduh template multi-departemen terbaru.')
	if (rows.length > 2001) throw new Error('Maksimal 2.000 rincian dalam satu file.')
	const groups = new Map<string, BudgetLine[]>()
	for (const [index, row] of rows.slice(1).entries()) {
		if (row.every((value) => value === null || value === '')) continue
		const code = String(row[0] ?? '')
			.trim()
			.toUpperCase()
		const account = accounts.find((a) => a.code === String(row[1] ?? '').trim())
		if (!code || !account) throw new Error(`Baris ${index + 2}: isi kode departemen dan pilih akun budgeting yang tersedia.`)
		const amounts = months.map((_, i) => (row[i + 4] === null || row[i + 4] === undefined || row[i + 4] === '' ? 0 : row[i + 4]))
		if (amounts.some((v) => typeof v !== 'number' || !Number.isFinite(v) || v < 0))
			throw new Error(`Baris ${index + 2}: nominal harus berupa angka nol atau lebih.`)
		const lines = groups.get(code) ?? []
		lines.push({
			account_id: account.id,
			account_code: account.code,
			account_name: account.name,
			section: account.section,
			prefix: account.prefix,
			sign: account.sign,
			code: String(row[2] ?? '')
				.trim()
				.toUpperCase(),
			description: String(row[3] ?? '').trim(),
			months: amounts as number[]
		})
		groups.set(code, lines)
	}
	if (!groups.size) throw new Error('File tidak berisi rincian. Isi template lalu coba lagi.')
	return [...groups].map(([department_code, lines]) => ({ department_code, lines }))
}
