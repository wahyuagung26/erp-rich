import * as v from 'valibot'

const optionalText = v.optional(v.pipe(v.string(), v.trim()), '')

export const channelSchema = v.object({
	code: v.pipe(v.string(), v.trim(), v.nonEmpty('Kode channel wajib diisi')),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty('Nama channel wajib diisi'), v.minLength(2, 'Minimal 2 karakter')),
	notes: optionalText
})

export type ChannelForm = v.InferOutput<typeof channelSchema>

// Returns { field: message } for the first issue per field, or null if valid.
export function validateChannel(data: unknown): Record<string, string> | null {
	const result = v.safeParse(channelSchema, data)
	if (result.success) return null
	const flat = v.flatten<typeof channelSchema>(result.issues).nested ?? {}
	return Object.fromEntries(Object.entries(flat).map(([k, msgs]) => [k, (msgs as string[])[0]]))
}
