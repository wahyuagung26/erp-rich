import axios from 'axios'

// Plain-language, actionable toast text for a failed request. Never leaks status codes / server internals on 5xx.
export function errorMessage(err: unknown, fallback = 'Terjadi kesalahan. Coba lagi, atau hubungi admin jika berulang.'): string {
	if (!axios.isAxiosError(err)) return fallback
	if (!err.response) return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.'
	const { status, data } = err.response
	if (status >= 500) return 'Server sedang bermasalah. Coba lagi beberapa saat, atau hubungi admin jika berulang.'
	if (status === 403) return 'Anda tidak punya akses untuk tindakan ini. Hubungi admin jika perlu akses.'
	// Backend 404 text only names the problem ('Merk tidak ditemukan'); the toast must also say what to do.
	if (status === 404) return 'Data tidak ditemukan, mungkin sudah dihapus oleh pengguna lain. Muat ulang halaman lalu coba lagi.'
	return data?.message ?? fallback
}
