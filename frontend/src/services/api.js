import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'development'
    ? 'http://localhost:3000/api'
    : 'https://timphongonline.onrender.com/api')

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || new URL(API_URL, window.location.origin).origin

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
})

export const roomService = {
  getAdmin: () => api.get("/rooms/admin/all"),
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  search: (query) => api.get(`/rooms/search?query=${query}`),
  getLiveSheet: () => api.get('/rooms/live-sheet'),
  importZalo: (formData) =>
    api.post('/rooms/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  importExcel: (formData) =>
    api.post('/rooms/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateStatus: (id, status) => api.patch(`/rooms/${id}/status`, { status }),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data)
}

export const leadService = {
  createOrUpdate: (data, config) => api.post('/leads', data, config),
  getMyLeadForRoom: (roomId) => api.get(`/leads/my-lead/${roomId}`),
  getMyBookings: (config) => api.get('/leads/my-bookings', config),
  cancelMyBooking: (id) => api.patch(`/leads/my-bookings/${id}/cancel`),
  getRoomStats: (roomId) => api.get(`/leads/room-stats/${roomId}`),
  getAllLeads: () => api.get('/leads/admin/all'),
  getPendingCount: () => api.get('/leads/admin/count'),
  updateStatus: (id, status, note, adminNote, paymentStatus) =>
    api.patch(`/leads/admin/${id}/status`, { status, note, adminNote, paymentStatus }),
  delete: (id) => api.delete(`/leads/admin/${id}`),
  getSuccessStories: () => api.get('/leads/success-stories'),
  getStats: () => api.get('/leads/stats')
}


export const userService = {
  toggleFavorite: (roomId) => api.post('/users/favorites', { roomId }),
  getFavorites: () => api.get('/users/favorites'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data)
}

export const chatService = {
  sendMessage: (data) => api.post('/chat/send', data),
  getMessages: (otherUserId) => api.get(`/chat/messages/${otherUserId}`),
  getUnreadTotal: () => api.get('/chat/unread-total'),
  getConversations: () => api.get('/chat/conversations'),
  searchUsers: (query) => api.get(`/chat/search-users?query=${query}`)
}

export const authService = {
  signup: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  check: () => api.get('/auth/check'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data)
}
