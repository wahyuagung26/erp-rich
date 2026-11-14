// Stand-in for src/utils/api.ts when the mock runs in Node (see mock-server.mjs): the real one pulls in the Vue router.
import axios from 'axios'

const api = axios.create({ validateStatus: () => true })
globalThis.__mockApi = api
export default api
