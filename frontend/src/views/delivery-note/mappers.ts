import type { DeliveryNote, DeliveryNoteRequest } from '@/utils/types'
import type { DeliveryNoteDraft } from './schema'

export function createEmptyDeliveryNoteDraft(): DeliveryNoteDraft {
	return {
		sales_invoice_id: null,
		date: new Date().toISOString().slice(0, 10),
		delivery_address: '',
		recipient: '',
		driver: '',
		vehicle: '',
		description: '',
		lines: []
	}
}

// Edit's initial draft — the invoice can't change, so lines come straight from the loaded surat jalan.
export function toDeliveryNoteDraft(note: DeliveryNote): DeliveryNoteDraft {
	return {
		sales_invoice_id: note.sales_invoice_id,
		date: note.date,
		delivery_address: note.delivery_address,
		recipient: note.recipient,
		driver: note.driver,
		vehicle: note.vehicle,
		description: note.description,
		lines: note.lines.map((line) => ({ ...line }))
	}
}

export function toDeliveryNoteRequest(draft: DeliveryNoteDraft): DeliveryNoteRequest {
	return {
		sales_invoice_id: draft.sales_invoice_id as number,
		date: draft.date,
		delivery_address: draft.delivery_address.trim(),
		recipient: draft.recipient.trim(),
		driver: draft.driver.trim(),
		vehicle: draft.vehicle.trim(),
		description: draft.description.trim(),
		lines: draft.lines.filter((line) => line.quantity > 0).map((line) => ({ product_id: line.product_id, quantity: line.quantity }))
	}
}
