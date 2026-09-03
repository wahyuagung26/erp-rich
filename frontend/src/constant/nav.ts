import { IconLayoutDashboard, IconListDetails, IconBuildingWarehouse, IconUsers, IconBook2, IconPalette } from '@tabler/icons-vue'
import type { Component } from 'vue'

export interface NavItem {
	label: string
	to: string
	icon: Component
}

export const NAV: NavItem[] = [
	{ label: 'Dashboard', to: '/dashboard', icon: IconLayoutDashboard },
	{ label: 'Bagan Akun', to: '/akun', icon: IconListDetails },
	{ label: 'Supplier', to: '/supplier', icon: IconBuildingWarehouse },
	{ label: 'Customer', to: '/customer', icon: IconUsers },
	{ label: 'Jurnal Umum', to: '/jurnal', icon: IconBook2 },
	{ label: 'Design System', to: '/design-system', icon: IconPalette }
]
