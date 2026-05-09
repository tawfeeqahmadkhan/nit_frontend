import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const api = axios.create({ baseURL: BASE })

// Attach JWT token on every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('solvenet_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
}

export const businessApi = {
  list:       (params) => api.get('/businesses', { params }),
  get:        (id)     => api.get(`/businesses/${id}`),
  getMatches: (id)     => api.get(`/businesses/${id}/matches`),
  rematch:    (id)     => api.post(`/businesses/${id}/rematch`),
}

export const matchApi = {
  list:   (params) => api.get('/matches', { params }),
  get:    (id)     => api.get(`/matches/${id}`),
  accept: (id)     => api.post(`/matches/${id}/accept`),
  reject: (id)     => api.post(`/matches/${id}/reject`),
}

export const messageApi = {
  send:   (data)    => api.post('/messages', data),
  thread: (matchId) => api.get(`/messages/${matchId}`),
}

export const graphApi = {
  get: () => api.get('/graph'),
}
