// A tiny store that lives outside React, because the fetch wrapper and the
// socket manager both need to write to it and neither is a component.
// Components read it with useSyncExternalStore, which gives a stable snapshot
// and no "state update on unmounted component" warnings.

import { useSyncExternalStore } from 'react'

const MAX_ENTRIES = 500
const TOAST_MS = 9000

let entries = [] // newest first
let toasts = []
let seq = 0

const entrySubs = new Set()
const toastSubs = new Set()

function publishEntries() {
  for (const fn of entrySubs) fn()
}
function publishToasts() {
  for (const fn of toastSubs) fn()
}

function stamp() {
  const d = new Date()
  const pad = (n, w = 2) => String(n).padStart(w, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
}

function addEntry(entry) {
  const next = [{ id: ++seq, at: stamp(), ...entry }, ...entries]
  entries = next.length > MAX_ENTRIES ? next.slice(0, MAX_ENTRIES) : next
  publishEntries()
}

/* ---------- writers ---------- */

// direction: 'out' | 'in' | 'event' | 'http'
export function logFrame(direction, payload, { error = false, label } = {}) {
  addEntry({ direction, label: label || direction, payload, error })
}

export function logEvent(label, payload) {
  addEntry({ direction: 'event', label, payload, error: false })
}

export function logHttp({ method, path, status, payload, error = false }) {
  addEntry({
    direction: 'http',
    label: `${method} ${status}`,
    payload: { method, path, status, body: payload ?? null },
    error,
  })
}

export function clearEntries() {
  entries = []
  publishEntries()
}

export function pushToast({ title, detail, payload, level = 'error' }) {
  const id = ++seq
  toasts = [...toasts, { id, title, detail: detail || '', payload: payload ?? null, level }]
  publishToasts()
  setTimeout(() => dismissToast(id), TOAST_MS)
  return id
}

export function dismissToast(id) {
  const next = toasts.filter((t) => t.id !== id)
  if (next.length !== toasts.length) {
    toasts = next
    publishToasts()
  }
}

/* ---------- readers ---------- */

function subscribeEntries(fn) {
  entrySubs.add(fn)
  return () => entrySubs.delete(fn)
}
function subscribeToasts(fn) {
  toastSubs.add(fn)
  return () => toastSubs.delete(fn)
}

export function useEntries() {
  return useSyncExternalStore(subscribeEntries, () => entries, () => entries)
}
export function useToasts() {
  return useSyncExternalStore(subscribeToasts, () => toasts, () => toasts)
}
