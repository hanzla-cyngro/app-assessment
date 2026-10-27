export interface FieldErrors {
  [field: string]: string
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }

  get isUnauthorized() {
    return this.status === 401
  }
  get isForbidden() {
    return this.status === 403
  }
  get isNotFound() {
    return this.status === 404
  }
}

interface NestErrorBody {
  statusCode?: number
  message?: string | string[]
  error?: string
}

function isNestErrorBody(value: unknown): value is NestErrorBody {
  return typeof value === 'object' && value !== null
}

export async function normalizeResponseError(res: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  if (isNestErrorBody(body)) {
    const raw = body.message
    const messages = Array.isArray(raw) ? raw : raw ? [raw] : []
    const fieldErrors: FieldErrors = {}
    for (const msg of messages) {
      const field = msg.split(' ')[0]
      if (field && /^[a-zA-Z]+$/.test(field) && !fieldErrors[field]) fieldErrors[field] = msg
    }
    return new ApiError(res.status, messages[0] ?? body.error ?? defaultMessage(res.status), fieldErrors)
  }
  return new ApiError(res.status, defaultMessage(res.status))
}

export function defaultMessage(status: number) {
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to access this resource.'
  if (status === 404) return 'The requested resource was not found.'
  if (status >= 500) return 'The server encountered an error. Please try again.'
  return 'The request could not be completed.'
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof DOMException && error.name === 'AbortError') return new ApiError(0, 'Request cancelled')
  return new ApiError(0, 'Network error. Check your connection and the API origin.')
}
