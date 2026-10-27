import { dismissToast, useToasts } from '../lib/log'

// Every REST failure and every error frame surfaces here as well as in the
// drawer, raw payload included, because a toast you cannot inspect is useless
// when the whole point is to debug the protocol.
export default function Toasts() {
  const toasts = useToasts()
  if (!toasts.length) return null
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.level}`}>
          <div className="head">
            <strong>{t.title}</strong>
            <button onClick={() => dismissToast(t.id)}>×</button>
          </div>
          {t.detail ? <div>{t.detail}</div> : null}
          {t.payload !== null && t.payload !== undefined ? (
            <pre>{typeof t.payload === 'string' ? t.payload : JSON.stringify(t.payload, null, 2)}</pre>
          ) : null}
        </div>
      ))}
    </div>
  )
}
