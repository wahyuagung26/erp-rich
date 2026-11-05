import {
	IconLayoutDashboard,
	IconBuilding,
	IconBuildingWarehouse,
	IconUsers,
	IconBook2,
	IconCashBanknoteOff,
	IconCashBanknote,
	IconReportMoney,
	IconPalette,
	IconDatabase,
	IconTag,
	IconCategory,
	IconRuler2,
	IconBuildingStore,
	IconUserDollar,
	IconShare2,
	IconSitemap,
	IconPackages,
	IconCalculator,
	IconFolders,
	IconListTree,
	IconListNumbers,
	IconReceipt2,
	IconReceiptRefund,
	IconCreditCardPay,
	IconFileImport,
	IconFileInvoice,
	IconShoppingCart,
	IconCreditCard,
	IconBox,
	IconCoin,
	IconWallet,
	IconCoins,
	IconPackageImport,
	IconTruckDelivery,
	IconBuildingBank,
	IconLock
} from '@tabler/icons-vue'
import type { Component } from 'vue'

export interface NavItem {
	label: string
	icon: Component
	to?: string // leaf: route target
	children?: NavItem[] // group: collapsible parent, no route of its own
}

export const NAV: NavItem[] = [
	{ label: 'Dashboard', to: '/dashboard', icon: IconLayoutDashboard },
	{
		label: 'Master',
		icon: IconDatabase,
		children: [
			{ label: 'Perusahaan', to: '/company', icon: IconBuilding },
			{ label: 'Merk', to: '/brand', icon: IconTag },
			{ label: 'Kategori Produk', to: '/product-category', icon: IconCategory },
			{ label: 'Satuan', to: '/unit', icon: IconRuler2 },
			{ label: 'Produk', to: '/product', icon: IconBox },
			{ label: 'Harga Produk', to: '/product-price', icon: IconCoin },
			{ label: 'Sales', to: '/sales', icon: IconUserDollar },
			{ label: 'Channel', to: '/channel', icon: IconShare2 },
			{ label: 'Cabang', to: '/branch', icon: IconBuildingStore },
			{ label: 'Departemen', to: '/department', icon: IconSitemap },
			{ label: 'Gudang', to: '/warehouse', icon: IconPackages },
			{ label: 'Jenis Penjualan', to: '/sales-type', icon: IconReceipt2 },
			{ label: 'Jenis Pembelian', to: '/purchase-type', icon: IconShoppingCart },
			{ label: 'Tipe Pembayaran', to: '/payment-type', icon: IconCreditCard },
			{ label: 'Biaya Penjualan', to: '/sales-expense', icon: IconTruckDelivery },
			{ label: 'Rekening Bank', to: '/bank-account', icon: IconBuildingBank },
			{ label: 'Supplier', to: '/supplier', icon: IconBuildingWarehouse },
			{ label: 'Customer', to: '/customer', icon: IconUsers }
		]
	},
	{
		label: 'Akuntansi',
		icon: IconCalculator,
		children: [
			{ label: 'Group Akun', to: '/account-group', icon: IconFolders },
			{ label: 'Sub Akun', to: '/sub-account', icon: IconListTree },
			{ label: 'Akun Perkiraan', to: '/account', icon: IconListNumbers },
			{ label: 'Jurnal Umum', to: '/journal', icon: IconBook2 },
			{ label: 'Jurnal Pemasukan', to: '/journal-income', icon: IconCashBanknote },
			{ label: 'Jurnal Pengeluaran', to: '/journal-expense', icon: IconCashBanknoteOff },
			{ label: 'Uang Muka Operasional', to: '/cash-advance', icon: IconWallet },
			{ label: 'Posisi Kas & Bank', to: '/cash-position', icon: IconReportMoney },
			{ label: 'Posting', to: '/posting', icon: IconLock }
		]
	},
	{
		label: 'Pembelian',
		icon: IconShoppingCart,
		children: [
			{ label: 'Order Pembelian', to: '/purchase-order', icon: IconShoppingCart },
			{ label: 'Penerimaan Pembelian', to: '/purchase-receipt', icon: IconPackageImport },
			{ label: 'Invoice Pembelian', to: '/purchase-invoice', icon: IconFileInvoice },
			{ label: 'Uang Muka Supplier', to: '/supplier-advance', icon: IconCoins },
			{ label: 'Retur Pembelian', to: '/purchase-return', icon: IconReceiptRefund },
			{ label: 'Hutang Supplier', to: '/supplier-payable', icon: IconCreditCardPay },
			{ label: 'Import Faktur Pajak', to: '/tax-invoice-import', icon: IconFileImport }
		]
	},
	{ label: 'Design System', to: '/design-system', icon: IconPalette }
]
