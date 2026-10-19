// One error shape for every REST failure, so callers branch on `kind`
// instead of re-deriving meaning from a status code at each call site.

export class ApiError extends Error {
  constructor({ status, kind, message, payload, fieldErrors }) {
    super(message)
    this.name = 'ApiError'
    this.status = status // 0 for a network failure
    this.kind = kind
    this.payload = payload ?? null // raw body, shown verbatim in the drawer
    this.fieldErrors = fieldErrors ?? null // { fieldName: "message" } for 422
  }
}

// The five cases the brief asks to handle separately, kept apart on purpose:
// 'unauthorized' redirects, 'validation' paints field errors, 'network' means
// the request never reached the server and is worth retrying by hand.
export function classify(status) {
  if (status === 0) return 'network'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 422) return 'validation'
  if (status >= 500) return 'server'
  return 'client' // 400, 404, 409, 429...
}

// FastAPI hands back two different `detail` shapes.
//
//   HTTPException  -> {"detail": "cannot start a conversation with yourself"}
//   RequestValidationError -> {"detail": [{"loc": ["body","email"], "msg": "...", "type": "..."}]}
//
// Everything below exists to tell those apart without crashing on either.
export function messageFrom(payload, status, method, path) {
  const detail = payload && payload.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0]
    if (first && typeof first.msg === 'string') {
      return detail.length > 1 ? `${first.msg} (+${detail.length - 1} more)` : first.msg
    }
  }
  if (payload && typeof payload.message === 'string') return payload.message
  return `${method} ${path} failed with ${status}`
}

// Turns the 422 list into { email: "value is not a valid email address" }.
// `loc` is like ["body", "email"]; the last string element is the field name.
// A validation error on the body as a whole has no field name, so it is filed
// under '_' and the forms render it above the inputs.
export function parseFieldErrors(payload) {
  const detail = payload && payload.detail
  if (!Array.isArray(detail)) return null
  const out = {}
  for (const item of detail) {
    if (!item || typeof item !== 'object') continue
    const loc = Array.isArray(item.loc) ? item.loc : []
    const named = [...loc].reverse().find((part) => typeof part === 'string' && part !== 'body')
    const key = named || '_'
    if (!out[key]) out[key] = item.msg || 'invalid value'
  }
  return Object.keys(out).length ? out : null
}
