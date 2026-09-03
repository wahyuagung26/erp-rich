// Stable per-browser id, sent with login. Mirrors the legacy `_DEVICEID_`.
export function getDeviceId(): string {
	const KEY = '_DEVICEID_'
	let id = localStorage.getItem(KEY)
	if (!id) {
		id = crypto.randomUUID()
		localStorage.setItem(KEY, id)
	}
	return id
}
