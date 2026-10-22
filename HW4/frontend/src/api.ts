export interface SizeStock {
  size: string
  quantity: number
}

export interface Product {
  product_id: string
  name: string
  garment_type: string
  description: string
  colors: string[]
  search_tags: string[]
  image_file_path: string
  image_url: string
  price: number
  inventory: SizeStock[]
  total_stock: number
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status === 404 ? 'not-found' : `Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export const fetchProducts = () => getJson<Product[]>('/api/products')
export const fetchProduct = (id: string) => getJson<Product>(`/api/products/${encodeURIComponent(id)}`)

export interface ChatReply {
  reply: string
  products: Product[]
}

export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
  products: Product[]
}

export const formatPrice = (price: number) => `$${price.toFixed(2)}`

export function shortDescription(text: string, max = 110): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

export interface User {
  id: number
  first_name: string
  last_name: string
  email: string
}

export interface RegisterInput {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data?.detail
    if (typeof detail === 'string') throw new Error(detail)
    throw new Error('Please check the form and try again.')
  }
  return data as T
}

export const registerUser = (input: RegisterInput) => postJson<User>('/api/auth/register', input)
export const loginUser = (email: string, password: string) => postJson<User>('/api/auth/login', { email, password })
export const logoutUser = () => postJson<{ ok: boolean }>('/api/auth/logout')
export const fetchCurrentUser = async (): Promise<User | null> => {
  const res = await fetch('/api/auth/me')
  return res.ok ? ((await res.json()) as User) : null
}

export interface PageContext {
  path: string
  product_id?: string
}

export interface HistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export type ChatEvent =
  | { type: 'status'; text: string }
  | { type: 'text'; text: string }
  | { type: 'done'; reply: string; products: Product[] }
  | { type: 'error'; detail: string }

/** Sends a chat message and reports events as the reply is written. Resolves with the final reply. */
export async function streamChat(
  message: string,
  page: PageContext,
  history: HistoryItem[],
  onEvent: (event: ChatEvent) => void,
): Promise<ChatReply> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, page, history }),
  })
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}))
    throw new Error(typeof data?.detail === 'string' ? data.detail : 'Please try again in a moment.')
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let final: ChatReply | null = null
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let end: number
    while ((end = buffer.indexOf('\n\n')) !== -1) {
      const line = buffer.slice(0, end).trim()
      buffer = buffer.slice(end + 2)
      if (!line.startsWith('data:')) continue
      const event = JSON.parse(line.slice(5)) as ChatEvent
      if (event.type === 'error') throw new Error(event.detail)
      if (event.type === 'done') final = { reply: event.reply, products: event.products }
      onEvent(event)
    }
  }
  if (!final) throw new Error('The reply was cut off. Please try again.')
  return final
}

/** `history` is only used for guests; signed-in shoppers' history is read from the database. */
export const sendChatMessage = (message: string, page: PageContext, history: HistoryItem[]) =>
  postJson<ChatReply>('/api/chat', { message, page, history })

export async function fetchChatHistory(): Promise<StoredMessage[]> {
  const res = await fetch('/api/chat/history')
  return res.ok ? ((await res.json()) as StoredMessage[]) : []
}
