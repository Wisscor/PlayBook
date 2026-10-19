// Shows the field-level messages parsed out of a FastAPI 422, plus any
// body-level message that had no field name attached.
export function FormError({ error }) {
  if (!error) return null
  const bodyLevel = error.fieldErrors && error.fieldErrors._
  return (
    <div className="formerr">
      <div>
        <strong>
          {error.status === 0 ? 'Network' : error.status} {error.kind}
        </strong>{' '}
        — {error.message}
      </div>
      {bodyLevel ? <div>{bodyLevel}</div> : null}
    </div>
  )
}

export function Field({ label, name, error, children }) {
  const msg = error && error.fieldErrors ? error.fieldErrors[name] : null
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children(Boolean(msg))}
      {msg ? <div className="err">{msg}</div> : null}
    </div>
  )
}
