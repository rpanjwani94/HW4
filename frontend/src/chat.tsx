import { createContext, useContext, useEffect, useState } from 'react'
import { matchPath, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { fetchChatHistory, streamChat } from './api'
import type { HistoryItem, PageContext, Product, StoredMessage } from './api'
import { useAuth } from './auth'

const GREETING: StoredMessage = {
  role: 'assistant',
  content: 'Hi! Ask me about our products, prices, or what sizes are in stock.',
  products: [],
}

interface ChatValue {
  messages: StoredMessage[]
  sending: boolean
  open: boolean
  setOpen: (open: boolean) => void
  /** What the assistant is doing right now, for example "Checking stock…". */
  status: string
  /** Products from the assistant's latest reply, shown on the Products page. */
  picks: Product[]
  send: (text: string) => Promise<void>
  clearPicks: () => void
}

const ChatContext = createContext<ChatValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userId = user?.id ?? null
  const [messages, setMessages] = useState<StoredMessage[]>([GREETING])
  const [sending, setSending] = useState(false)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('Thinking…')
  const [picks, setPicks] = useState<Product[]>([])

  useEffect(() => {
    setPicks([])
    if (userId === null) {
      setMessages([GREETING])
      return
    }
    let cancelled = false
    fetchChatHistory()
      .then((history) => {
        if (!cancelled) setMessages([GREETING, ...history])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  async function send(text: string) {
    // Page context: which page the shopper is on, and which product if it is a product page.
    const page: PageContext = { path: pathname }
    const productId = matchPath('/products/:productId', pathname)?.params.productId
    if (productId) page.product_id = productId
    // Guests have no saved history, so the browser sends the recent conversation along.
    const recent: HistoryItem[] = userId === null
      ? messages.slice(1).slice(-10).map((m) => ({ role: m.role, content: m.content }))
      : []
    const patchLast = (patch: Partial<StoredMessage>) =>
      setMessages((m) => m.map((msg, i) => (i === m.length - 1 ? { ...msg, ...patch } : msg)))
    setMessages((m) => [...m, { role: 'user', content: text, products: [] }, { role: 'assistant', content: '', products: [] }])
    setStatus('Thinking…')
    setSending(true)
    try {
      const reply = await streamChat(text, page, recent, (event) => {
        if (event.type === 'status') setStatus(event.text)
        else if (event.type === 'text') patchLast({ content: event.text })
      })
      patchLast({ content: reply.reply, products: reply.products })
      if (reply.products.length > 0) {
        setPicks(reply.products)
        // A search with several matches appears on the Products page, so bring the shopper there.
        // An answer about a single item leaves them on the page they are reading.
        if (reply.products.length > 1 && pathname !== '/products') navigate('/products')
      }
    } catch (err) {
      patchLast({ content: err instanceof Error ? err.message : "Sorry, I couldn't reach the shop assistant. Please try again." })
    } finally {
      setSending(false)
    }
  }

  return (
    <ChatContext.Provider value={{ messages, sending, open, setOpen, status, picks, send, clearPicks: () => setPicks([]) }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside ChatProvider')
  return ctx
}
