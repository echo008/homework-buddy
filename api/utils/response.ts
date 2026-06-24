import type { ApiResponse } from '../../shared/types.js'
import { RESPONSE_CODES } from '../../shared/constants.js'

export function success<T>(data?: T, message = '操作成功'): ApiResponse<T> {
  return { code: RESPONSE_CODES.SUCCESS, message, data }
}

export function fail(message: string, code: number = RESPONSE_CODES.SERVER_ERROR, data?: unknown): ApiResponse {
  return { code, message, data }
}

export function paramError(message: string): ApiResponse {
  return fail(message, RESPONSE_CODES.PARAM_ERROR)
}

export function notFound(message = '资源不存在'): ApiResponse {
  return fail(message, RESPONSE_CODES.NOT_FOUND)
}

export function noPermission(message = '无权操作'): ApiResponse {
  return fail(message, RESPONSE_CODES.NO_PERMISSION)
}

export function duplicate(message = '数据已存在'): ApiResponse {
  return fail(message, RESPONSE_CODES.DUPLICATE)
}
