import { STORE } from '../config'
import YaleY from './YaleY'

export default function Footer() {
  return (
    <footer className="footer">
      <YaleY size={44} />
      <p>{STORE.name} · {STORE.address}</p>
      <p>Order help: <a href={`mailto:${STORE.orderEmail}`}>{STORE.orderEmail}</a></p>
    </footer>
  )
}
