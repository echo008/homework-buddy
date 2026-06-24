import axios from 'axios'
import type { ApiResponse } from '@shared/types'
import { RESPONSE_CODES } from '@shared/constants'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res: ApiResponse = response.data
    if (res.code !== RESPONSE_CODES.SUCCESS) {
      if (res.code === RESPONSE_CODES.NO_PERMISSION) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response.data
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default request
