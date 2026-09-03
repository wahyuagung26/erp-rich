import { akunSeed } from './fixtures/akun'
import { jurnalSeed } from './fixtures/jurnal'
import type { Akun, Jurnal } from '@/utils/types'

// Single in-memory store shared by every mock module. Mutations persist for
// the browser session; a reload re-seeds from fixtures.
export const db: { akun: Akun[]; jurnal: Jurnal[] } = {
	akun: structuredClone(akunSeed),
	jurnal: structuredClone(jurnalSeed)
}
