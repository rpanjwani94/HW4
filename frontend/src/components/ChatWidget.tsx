import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../api'
import { useAuth } from '../auth'
import { useChat } from '../chat'
import DanHead from './DanHead'
import YaleY from './YaleY'

const STARTERS = ['What hoodies do you have?', 'Gift ideas under $50', 'What do you have in size medium?']

export default function ChatWidget() {
  const { user, ready } = useAuth()
  const { messages, sending, status, open, setOpen, send } = useChat()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, sending, open])

  function submit(text: string) {
    const t = text.trim()
    if (!t || sending) return
    setDraft('')
    void send(t)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submit(draft)
  }

  if (!open) {
    return (
      <button className="chat-launcher" onClick={() => setOpen(true)} aria-label="Open chat">
        <YaleY size={26} />
        <span>Ask the shop assistant</span>
      </button>
    )
  }

  const onlyGreeting = messages.length === 1

  return (
    <aside className="chat-panel" aria-label="Shop assistant chat">
      <header>
        <DanHead size={40} />
        <div>
          <strong>Shop assistant</strong>
          <span>Prices, sizes and stock, live</span>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close chat">×</button>
      </header>
      <div className="chat-log" role="log" aria-live="polite">
        {messages.filter((m) => m.content !== '' || m.products.length > 0).map((m, i) => (
          <div key={i} className={`bubble-wrap ${m.role}`}>
            {m.role === 'assistant' && <DanHead size={28} />}
            <div className="bubble-col">
              <p className={`bubble ${m.role}`}>{m.content}</p>
              {m.products.length > 0 && (
                <ul className="chat-cards">
                  {m.products.map((p) => (
                    <li key={p.product_id}>
                      <Link to={`/products/${p.product_id}`} onClick={() => setOpen(false)}>
                        <img src={p.image_url} alt="" loading="lazy" />
                        <span>{p.name}</span>
                        <strong>{formatPrice(p.price)}</strong>
                      </Link>
                      {p.total_stock > 0 ? (
                        <Link className="chat-buy" to={`/products/${p.product_id}#buy`} onClick={() => setOpen(false)}>
                          Buy now
                        </Link>
                      ) : (
                        <span className="chat-soldout">Sold out</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
        {sending && messages[messages.length - 1]?.content === '' && (
          <div className="bubble-wrap assistant">
            <DanHead size={28} />
            <p className="bubble assistant typing" role="status">{status}</p>
          </div>
        )}
        {onlyGreeting && !sending && (
          <div className="starters" aria-label="Suggested questions">
            {STARTERS.map((s) => (
              <button key={s} type="button" className="chip" onClick={() => submit(s)}>{s}</button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>
      {ready && !user && (
        <p className="chat-login">
          Chatting as a guest. <Link to="/login" onClick={() => setOpen(false)}>Log in</Link> or{' '}
          <Link to="/create-account" onClick={() => setOpen(false)}>create an account</Link> to save your chat history.
        </p>
      )}
      <form onSubmit={onSubmit}>
        <label htmlFor="chat-input" className="sr-only">Your message</label>
        <input id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask about a product…" autoComplete="off" maxLength={1000} />
        <button className="button" type="submit" disabled={sending}>Send</button>
      </form>
    </aside>
  )
}
