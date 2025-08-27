import axios from 'axios'

// 创建实例
const http = axios.create({
    baseURL: 'http://192.168.1.105:14514/break', // 👈 改成你的后端地址
    timeout: 5000,
})

// 请求拦截器（可统一加 token）
http.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default http
