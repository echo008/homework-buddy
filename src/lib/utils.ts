import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

type ToastListener = (toast: ToastMessage) => void

const listeners = new Set<ToastListener>()
let toastId = 0

function addToast(type: ToastType, message: string) {
  const id = String(++toastId)
  const toast: ToastMessage = { id, type, message }
  listeners.forEach(listener => listener(toast))
}

export const toast = {
  success(message: string) {
    addToast('success', message)
  },
  error(message: string) {
    addToast('error', message)
  },
  info(message: string) {
    addToast('info', message)
  },
  warning(message: string) {
    addToast('warning', message)
  }
}

export function subscribeToast(listener: ToastListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function formatDate(dateInput: string | number | Date): string {
  const d = new Date(dateInput)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
