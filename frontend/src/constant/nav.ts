import {
	IconLayoutDashboard,
	IconListDetails,
	IconBuilding,
	IconBuildingWarehouse,
	IconUsers,
	IconBook2,
	IconPalette,
	IconDatabase,
	IconTag,
	IconCategory,
	IconRuler2,
	IconBuildingStore
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
			{ label: 'Bagan Akun', to: '/akun', icon: IconListDetails },
			{ label: 'Perusahaan', to: '/perusahaan', icon: IconBuilding },
			{ label: 'Merk', to: '/merk', icon: IconTag },
			{ label: 'Kategori Produk', to: '/kategori', icon: IconCategory },
			{ label: 'Satuan', to: '/satuan', icon: IconRuler2 },
			{ label: 'Cabang', to: '/cabang', icon: IconBuildingStore },
			{ label: 'Supplier', to: '/supplier', icon: IconBuildingWarehouse },
			{ label: 'Customer', to: '/customer', icon: IconUsers }
		]
	},
	{ label: 'Jurnal Umum', to: '/jurnal', icon: IconBook2 },
	{ label: 'Design System', to: '/design-system', icon: IconPalette }
]
