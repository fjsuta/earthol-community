import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000
});

export const earthApi = {
  getData: () => api.get('/earth/data'),
  getRegions: () => api.get('/earth/regions')
};

export const forumApi = {
  getCategories: (params?: any) => api.get('/forum/categories', { params }),
  getPosts: (params?: any) => api.get('/forum/posts', { params }),
  getPost: (id: number) => api.get(`/forum/posts/${id}`),
  getComments: (id: number) => api.get(`/forum/posts/${id}/comments`),
  createPost: (data: any) => api.post('/forum/posts', data),
  createComment: (data: any) => api.post('/forum/comments', data),
  likePost: (id: number, data: any) => api.post(`/forum/posts/${id}/like`, data),
  collectPost: (id: number, data: any) => api.post(`/forum/posts/${id}/collect`, data),
  report: (data: any) => api.post('/forum/report', data)
};

export const aiApi = {
  chat: (data: any) => api.post('/ai/chat', data),
  getHistory: (userId: number, params?: any) => api.get(`/ai/history/${userId}`, { params }),
  getPersonas: () => api.get('/ai/personas'),
  getConversations: (userId: number) => api.get(`/ai/conversations/${userId}`),
  createConversation: (data: any) => api.post('/ai/conversations', data),
  deleteConversation: (id: number) => api.delete(`/ai/conversations/${id}`),
  clearMemory: (userId: number, params?: any) => api.delete(`/ai/memory/${userId}`, { params })
};

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/password', data),
  getRegions: () => api.get('/auth/regions'),
  getUser: (id: number) => api.get(`/auth/user/${id}`)
};

export const socialApi = {
  getFriends: (userId: number) => api.get('/social/friends', { params: { userId } }),
  getFriendRequests: (userId: number) => api.get('/social/friend-requests', { params: { userId } }),
  sendFriendRequest: (data: any) => api.post('/social/friend-request', data),
  handleFriendRequest: (id: number, action: string) => api.put(`/social/friend-request/${id}`, { action }),
  deleteFriend: (id: number) => api.delete(`/social/friend/${id}`),
  getMessages: (params: any) => api.get('/social/messages', { params }),
  sendMessage: (data: any) => api.post('/social/messages', data),
  getUnreadCount: (userId: number) => api.get('/social/messages/unread-count', { params: { userId } }),
  recallMessage: (id: number, userId: number) => api.delete(`/social/messages/${id}`, { params: { userId } }),
  getGlobalMessages: (params?: any) => api.get('/social/global-messages', { params }),
  getOnlineUsers: (params?: any) => api.get('/social/online-users', { params }),
  searchUsers: (params: any) => api.get('/social/search-users', { params })
};

export const userApi = {
  getSettings: (userId: number) => api.get('/user/settings', { params: { userId } }),
  updateSettings: (data: any) => api.put('/user/settings', data),
  getNotifications: (params: any) => api.get('/user/notifications', { params }),
  markNotificationRead: (id: number) => api.put(`/user/notifications/${id}/read`),
  markAllNotificationsRead: (userId: number) => api.put('/user/notifications/read-all', { userId }),
  deleteNotification: (id: number) => api.delete(`/user/notifications/${id}`),
  addHistory: (data: any) => api.post('/user/history', data),
  getHistory: (params: any) => api.get('/user/history', { params }),
  clearHistory: (data: any) => api.delete('/user/history', { data }),
  search: (params: any) => api.get('/user/search', { params }),
  getProfile: (id: number) => api.get(`/user/profile/${id}`),
  follow: (data: any) => api.post('/user/follow', data),
  getFollowers: (userId: number) => api.get(`/user/followers/${userId}`),
  getFollowing: (userId: number) => api.get(`/user/following/${userId}`),
  getCollections: (params: any) => api.get('/forum/collections', { params }),
  getCollectionFolders: (userId: number) => api.get('/forum/collection-folders', { params: { userId } }),
  createCollectionFolder: (data: any) => api.post('/forum/collection-folders', data)
};

export const configApi = {
  getSystemInfo: () => api.get('/config/system/info'),
  
  getSystemConfigs: (category?: string) => api.get('/config/configs/system', { params: { category } }),
  setSystemConfig: (data: any) => api.post('/config/configs/system', data),
  
  getAIConfigs: () => api.get('/config/configs/ai'),
  createAIConfig: (data: any) => api.post('/config/configs/ai', data),
  updateAIConfig: (id: number, data: any) => api.put(`/config/configs/ai/${id}`, data),
  deleteAIConfig: (id: number) => api.delete(`/config/configs/ai/${id}`),
  testAIConfig: (id: number) => api.post(`/config/configs/ai/${id}/test`),
  
  getStorageConfigs: () => api.get('/config/configs/storage'),
  createStorageConfig: (data: any) => api.post('/config/configs/storage', data),
  updateStorageConfig: (id: number, data: any) => api.put(`/config/configs/storage/${id}`),
  deleteStorageConfig: (id: number) => api.delete(`/config/configs/storage/${id}`),
  testStorageConfig: (id: number) => api.post(`/config/configs/storage/${id}/test`),
  
  getDatabaseConfigs: () => api.get('/config/configs/database'),
  createDatabaseConfig: (data: any) => api.post('/config/configs/database', data),
  updateDatabaseConfig: (id: number, data: any) => api.put(`/config/configs/database/${id}`),
  deleteDatabaseConfig: (id: number) => api.delete(`/config/configs/database/${id}`),
  testDatabaseConfig: (id: number) => api.post(`/config/configs/database/${id}/test`),

  getICPConfigs: () => api.get('/config/configs/icp'),
  updateICPConfigs: (data: any) => api.post('/config/configs/icp', data),

  getPublicConfigs: () => api.get('/config/public/config')
};

export const adminApi = {
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserRole: (id: number, role: string) => api.put(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id: number, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data: any) => api.post('/admin/categories', data),
  updateCategory: (id: number, data: any) => api.put(`/admin/categories/${id}`, data),
  getPendingPosts: () => api.get('/admin/posts/pending'),
  reviewPost: (id: number, status: string, note?: string) => api.put(`/admin/posts/${id}/review`, { status, note }),
  pinPost: (id: number, isPinned: boolean) => api.put(`/admin/posts/${id}/pin`, { isPinned }),
  essencePost: (id: number, isEssence: boolean) => api.put(`/admin/posts/${id}/essence`, { isEssence }),
  deletePost: (id: number) => api.delete(`/admin/posts/${id}`),
  getStats: () => api.get('/admin/stats'),
  getAnnouncements: (status?: string) => api.get('/admin/announcements', { params: { status } }),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data),
  deleteAnnouncement: (id: number) => api.delete(`/admin/announcements/${id}`),
  getLogs: (params?: any) => api.get('/admin/logs', { params }),
  getSensitiveWords: () => api.get('/admin/sensitive-words'),
  addSensitiveWord: (data: any) => api.post('/admin/sensitive-words', data),
  deleteSensitiveWord: (id: number) => api.delete(`/admin/sensitive-words/${id}`)
};

export default api;
