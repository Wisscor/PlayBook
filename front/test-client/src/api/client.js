// The only place fetch() is called. Every failure leaves here as an ApiError
// with a `kind`, and every call — success or failure — is written to the debug
// drawer with its raw body.

import { ApiError, classify, messageFrom, parseFieldErrors } from '../lib/errors'
import { logHttp, pushToast } from '../lib/log'

// Paths are relative, so the request goes to whichever host served the page and
// the Vite proxy forwards it. Nothing is cross-origin. See vite.config.js.
let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

/**
 * @param {string} method
 * @param {string} path  e.g. '/auth/login'
 * @param {object} [body]
 * @param {{silent401?: boolean}} [opts]
 *   silent401 skips the global redirect and the toast. The session probe on
 *   page load gets a 401 whenever nobody is logged in, which is normal and must
 *   not bounce the user or raise a toast.
 */
export async function request(method, path, body, opts = {}) {
  let res
  try {
    res = await fetch(path, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    // fetch only rejects when the request never got a response: server down,
    // DNS, or the proxy refusing. An HTTP error status resolves normally.
    const err = new ApiError({
      status: 0,
      kind: 'network',
      message: `Network failure — ${method} ${path} never reached a server.`,
      payload: { error: String(cause), hint: 'Is the backend running, and is BACKEND_URL in .env correct?' },
    })
    logHttp({ method, path, status: 0, payload: err.payload, error: true })
    toastError(err, method, path, opts)
    throw err
  }

  // Read as text first: an empty body (204) and a non-JSON body (a proxy error
  // page, an unhandled 500 before FastAPI formats it) both have to survive.
  const text = await res.text()
  let payload = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = { nonJsonBody: text }
    }
  }

  if (!res.ok) {
    const kind = classify(res.status)
    const err = new ApiError({
      status: res.status,
      kind,
      message: messageFrom(payload, res.status, method, path),
      payload,
      fieldErrors: kind === 'validation' ? parseFieldErrors(payload) : null,
    })
    logHttp({ method, path, status: res.status, payload, error: true })
    toastError(err, method, path, opts)
    if (kind === 'unauthorized' && !opts.silent401 && unauthorizedHandler) {
      unauthorizedHandler(err)
    }
    throw err
  }

  logHttp({ method, path, status: res.status, payload })
  return payload
}

// Raised from here rather than from each caller, so no call site can forget to
// surface a failure. Forms additionally paint field errors next to the inputs.
const KIND_TITLE = {
  network: 'Network failure',
  unauthorized: 'Not authenticated (401)',
  forbidden: 'Forbidden (403)',
  validation: 'Validation failed (422)',
  server: 'Server error',
  client: 'Request rejected',
}

function toastError(err, method, path, opts) {
  if (err.kind === 'unauthorized' && opts.silent401) return
  pushToast({
    title: `${KIND_TITLE[err.kind] || 'Request failed'} — ${method} ${path}`,
    detail: err.message,
    payload: err.payload,
  })
}

export const api = {
  get: (path, opts) => request('GET', path, undefined, opts),
  post: (path, body, opts) => request('POST', path, body, opts),
  patch: (path, body, opts) => request('PATCH', path, body, opts),
  del: (path, opts) => request('DELETE', path, undefined, opts),
}
