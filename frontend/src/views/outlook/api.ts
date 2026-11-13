import axios from 'axios'
import api from '@/utils/api'
import { errorMessage } from '@/utils/errorMessage'
import { useToast } from '@/composables/useToast'
import type { OutlookState, OutlookStateFull } from './types'

// A 422 with field errors reads as its first field message; everything else goes through the shared plain-language mapper.
export function failText(err: unknown, fallback?: string): string {
	if (axios.isAxiosError(err) && err.response?.status === 422) {
		const first = Object.values((err.response.data?.errors ?? {}) as Record<string, string[]>).flat()[0]
		if (first) return first
	}
	return errorMessage(err, fallback)
}

export interface Written<R = unknown> {
	state: OutlookStateFull
	result?: R
	message: string
}

// Writes go through one queue so responses apply in the order they were sent (typing across cells never lets an older state win).
let queue: Promise<unknown> = Promise.resolve()

// Sends one write; resolves with the fresh state, or null after toasting the failure (the caller then reloads the period).
// `ok` = success toast text (omit for quiet auto-save cells); a string is shown instead of the server message.
export function useOutlookApi() {
	const toast = useToast()
	async function send<R = unknown>(method: 'post' | 'put' | 'delete', url: string, body?: unknown, ok: boolean | string = true): Promise<Written<R> | null> {
		const run = async () => {
			try {
				const res = await api.request<{ data: { state: OutlookStateFull; result?: R }; message: string }>({ method, url, data: body })
				if (ok) toast.success(typeof ok === 'string' ? ok : res.data.message)
				return { state: res.data.data.state, result: res.data.data.result, message: res.data.message }
			} catch (err) {
				toast.error(failText(err))
				return null
			}
		}
		const next = queue.then(run, run)
		queue = next
		return next
	}
	return { send }
}

export async function fetchState(year: number, month: number): Promise<OutlookState> {
	return (await api.get<{ data: OutlookState }>('/outlook/state', { params: { year, month } })).data.data
}
