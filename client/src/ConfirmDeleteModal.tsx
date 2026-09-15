import { useEffect, useRef, useState } from 'react'

const PHRASE = 'USUWAM'

export default function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const ok = text.trim() === PHRASE

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok || busy) return
    setBusy(true)
    try { await onConfirm() } finally { setBusy(false) }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="del-title" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2 id="del-title">Czy na pewno chcesz usunąć swoje dane?</h2>
        <p>
          Konto, wszystkie tankowania i ustawienia zostaną usunięte <strong>bezpowrotnie</strong>. Nie ma kopii ani
          możliwości przywrócenia.
        </p>
        <label>
          Napisz <code>{PHRASE}</code>, żeby usunąć
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PHRASE}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <div className="actions">
          <button type="submit" className="danger solid" disabled={!ok || busy}>
            {busy ? 'Usuwanie…' : 'Usuń wszystko'}
          </button>
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>Anuluj</button>
        </div>
      </form>
    </div>
  )
}
