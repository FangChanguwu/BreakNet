import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>('')
  const qq = ref<string>('')

  // 计算属性：是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // Action: 登录成功调用
  function setLoginInfo(newToken: string, newQq: string) {
    token.value = newToken
    qq.value = newQq
  }

  // Action: 登出调用
  function logout() {
    token.value = ''
    qq.value = ''
    localStorage.removeItem('auth') // 清理
  }

  return { token, qq, isLoggedIn, setLoginInfo, logout }
}, {
  persist: true // 开启持久化，会自动同步到 localStorage
})