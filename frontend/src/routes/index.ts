import type { RouteRecordRaw } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import dashboard from './dashboard'
import perusahaan from './perusahaan'
import merk from './merk'
import kategori from './kategori'
import satuan from './satuan'
import cabang from './cabang'
import departemen from './departemen'
import gudang from './gudang'
import jenisPenjualan from './jenis-penjualan'
import tipePembayaran from './tipe-pembayaran'
import groupAkun from './group-akun'
import subAkun from './sub-akun'
import akunPerkiraan from './akun-perkiraan'
import supplier from './supplier'
import customer from './customer'
import jurnal from './jurnal'

const routes: RouteRecordRaw[] = [
	{ path: '/', redirect: '/dashboard' },
	{
		path: '/',
		component: DefaultLayout,
		children: [
			...dashboard,
			...perusahaan,
			...merk,
			...kategori,
			...satuan,
			...cabang,
			...departemen,
			...gudang,
			...jenisPenjualan,
			...tipePembayaran,
			...groupAkun,
			...subAkun,
			...akunPerkiraan,
			...supplier,
			...customer,
			...jurnal,
			{
				path: '/design-system',
				name: 'DesignSystem',
				component: () => import('@/views/design-system/index.vue'),
				meta: { auth: true, breadcrumb: 'Design System' }
			}
		]
	},
	{ path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
	{ path: '/403', name: 'Forbidden', component: () => import('@/views/ForbiddenView.vue') },
	{ path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('@/views/NotFoundView.vue') }
]

export default routes
