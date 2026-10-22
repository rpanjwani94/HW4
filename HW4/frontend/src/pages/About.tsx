import { STORE } from '../config'

export default function About() {
  return (
    <section className="page">
      <h1>About Us</h1>
      <p>
        We're {STORE.name}, the shop for Yale gear that's meant to be worn, carried, and used. We started
        this site because finding the right hoodie or the right size shouldn't mean digging through pages of
        listings.
      </p>
      <p>
        So we built a shop assistant you can just talk to. Tell it what you're after and it pulls up matching
        items on the page, with honest answers about price and what's left in your size.
      </p>
      <h2>Find us</h2>
      <p>
        Visit the store at <strong>{STORE.address}</strong>.
      </p>
      <h2>Need help with an order?</h2>
      <p>
        Use the chat, or email us at <a href={`mailto:${STORE.orderEmail}`}>{STORE.orderEmail}</a>.
      </p>
    </section>
  )
}
