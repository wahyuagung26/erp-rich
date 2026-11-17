import type { DeliveryNote } from '@/utils/types'

// Stored shape: only what the user entered. Invoice / customer / product display fields and `invoice_quantity` are
// re-resolved from db.salesInvoice on every read (mocks/modules/delivery-note.ts).
export type DeliveryNoteRow = Pick<
	DeliveryNote,
	| 'id'
	| 'number'
	| 'date'
	| 'sales_invoice_id'
	| 'delivery_address'
	| 'recipient'
	| 'driver'
	| 'vehicle'
	| 'description'
	| 'created_by'
	| 'created_at'
> & {
	lines: { variant_id: number; quantity: number }[]
}

// One SJ per approved invoice. Invoice 1 is shipped in part (3 of 4), 2 in full, 4 sits in the closed period (an SJ stays editable there).
// Invoice 6 (approved, no SJ) is left free so the create form has something to pick.
export const deliveryNoteSeed: DeliveryNoteRow[] = [
	{
		id: 1,
		number: 'SJ-RIN.INV260920/001',
		date: '2026-09-21',
		sales_invoice_id: 1,
		delivery_address: 'Jl. Rungkut Industri III No. 7, Surabaya',
		recipient: 'Pak Hendra (gudang)',
		driver: 'Sutrisno',
		vehicle: 'L 8123 XY',
		description: 'Pengiriman tahap pertama, sisa 1 unit menyusul',
		created_by: 'Admin',
		created_at: '2026-09-21T08:30:00+07:00',
		lines: [{ variant_id: 1, quantity: 3 }]
	},
	{
		id: 2,
		number: 'SJ-RIN.INV260919/001',
		date: '2026-09-20',
		sales_invoice_id: 2,
		delivery_address: 'Kawasan Industri SIER Blok J-3',
		recipient: 'Ibu Dewi',
		driver: 'Herman',
		vehicle: 'B 9021 KCD',
		description: '',
		created_by: 'Admin',
		created_at: '2026-09-20T08:30:00+07:00',
		lines: [{ variant_id: 3, quantity: 8 }]
	},
	{
		id: 3,
		number: 'SJ-RIN.INV260715/001',
		date: '2026-07-16',
		sales_invoice_id: 4,
		delivery_address: 'Jl. Rungkut Industri III No. 7, Surabaya',
		recipient: '',
		driver: 'Sutrisno',
		vehicle: 'L 8123 XY',
		description: 'Periode Juli (sudah closing), surat jalan tetap bisa diubah',
		created_by: 'Admin',
		created_at: '2026-07-16T08:30:00+07:00',
		lines: [{ variant_id: 3, quantity: 10 }]
	}
]
