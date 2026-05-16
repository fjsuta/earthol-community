import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Forum from '../views/Forum.vue';
import PostDetail from '../views/PostDetail.vue';
import Chat from '../views/Chat.vue';
import ChatRoom from '../views/ChatRoom.vue';
import Profile from '../views/Profile.vue';
import Settings from '../views/Settings.vue';
import Search from '../views/Search.vue';
import Notifications from '../views/Notifications.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '全球数据' }
  },
  {
    path: '/forum',
    name: 'Forum',
    component: Forum,
    meta: { title: '论坛社区' }
  },
  {
    path: '/forum/:id',
    name: 'PostDetail',
    component: PostDetail,
    meta: { title: '帖子详情' }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat,
    meta: { title: 'AI对话' }
  },
  {
    path: '/chatroom',
    name: 'ChatRoom',
    component: ChatRoom,
    meta: { title: '聊天室' }
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: Profile,
    meta: { title: '个人主页' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '个人设置' }
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
    meta: { title: '搜索' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: Notifications,
    meta: { title: '通知中心' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '地球OL'} - 地球OL全球玩家社区`;
  next();
});

export default router;
