// Static stock-on-hand per product per gudang (the running total of stock movements). Read-only: Daftar Harga
// never changes it. Services (PRD003) carry no stock. ponytail: static seed; wire to real stock movements when Invoice/Penerimaan post stok.
export const priceListStockSeed: { product_id: number; warehouse_id: number; qty: number }[] = [
	{ product_id: 1, warehouse_id: 1, qty: 45 },
	{ product_id: 2, warehouse_id: 1, qty: 3 }
]
