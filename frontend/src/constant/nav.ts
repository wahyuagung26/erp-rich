import {
	IconLayoutDashboard,
	IconBuilding,
	IconBuildingWarehouse,
	IconUsers,
	IconBook2,
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
	IconCreditCard
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
			{ label: 'Sales', to: '/sales', icon: IconUserDollar },
			{ label: 'Channel', to: '/channel', icon: IconShare2 },
			{ label: 'Cabang', to: '/branch', icon: IconBuildingStore },
			{ label: 'Departemen', to: '/department', icon: IconSitemap },
			{ label: 'Gudang', to: '/warehouse', icon: IconPackages },
			{ label: 'Jenis Penjualan', to: '/sales-type', icon: IconReceipt2 },
			{ label: 'Tipe Pembayaran', to: '/payment-type', icon: IconCreditCard },
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
			{ label: 'Akun Perkiraan', to: '/account', icon: IconListNumbers }
		]
	},
	{ label: 'Jurnal Umum', to: '/journal', icon: IconBook2 },
	{ label: 'Design System', to: '/design-system', icon: IconPalette }
]
