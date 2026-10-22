import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts } from '../api'
import type { Product } from '../api'
import { useChat } from '../chat'
import { STORE } from '../config'
import Art from '../components/Art'
import type { ArtKind } from '../components/Art'
import ProductCard from '../components/ProductCard'

interface Category {
  label: string
  kinds: ArtKind[]
}

const PRIDE: Category[] = [
  { label: 'Water bottles', kinds: ['bottle'] },
  { label: 'Totes and bags', kinds: ['tote'] },
  { label: 'Tumblers and mugs', kinds: ['tumbler', 'mug'] },
]
const OFFICE: Category[] = [
  { label: 'Journals', kinds: ['journal'] },
  { label: 'Pens', kinds: ['pen'] },
  { label: 'Sticky pads', kinds: ['sticky'] },
]

const FAVORITES = ['basic-hoodie-big-yale', 'crew-left-chest-hoodie', 'baseball-left-chest-crewneck', '2025-yale-vs-harvard-t-shirt']
const GAME_DAY = '2025-yale-vs-harvard-t-shirt'

const PILLARS = [
  { title: 'Honest stock', text: 'Our assistant checks the real inventory, size by size, so "in stock" means in stock.' },
  { title: 'Made for Bulldogs', text: 'Hoodies for hockey, fencing, sailing and squash, plus the classics every Yale wardrobe needs.' },
  { title: 'Right here in New Haven', text: `Stop by ${STORE.address}, or write to our order team any time.` },
]

function CategoryCards({ items }: { items: Category[] }) {
  return (
    <ul className="cards">
      {items.map((c) => (
        <li key={c.label}>
          <Link to="/products">
            <Art kinds={c.kinds} label={c.label} />
            <span className="card-label">{c.label}</span>
            <span className="card-cta">Shop now →</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const { setOpen } = useChat()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetchProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const byId = new Map(products.map((p) => [p.product_id, p]))
  const favorites = FAVORITES.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p))
  const collage = favorites.slice(0, 3)
  const gameDay = byId.get(GAME_DAY)

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow light">Campus Customs · New Haven</p>
          <h1>
            Wear the blue.
            <br />
            <em>Carry the blue.</em>
          </h1>
          <p className="lede">
            Yale gear for the people who actually wear it, from game-day tees to the hoodie that survives finals week. Ask our shop assistant
            what is in stock in your size and it will tell you straight.
          </p>
          <div className="hero-actions">
            <Link className="button light" to="/products">Shop the collection</Link>
            <button className="button ghost" type="button" onClick={() => setOpen(true)}>Ask the shop assistant</button>
          </div>
        </div>
        {collage.length > 0 && (
          <ul className="collage" aria-label="Featured gear">
            {collage.map((p, i) => (
              <li key={p.product_id} style={{ ['--i' as string]: i }}>
                <Link to={`/products/${p.product_id}`} aria-label={p.name}>
                  <img src={p.image_url} alt="" />
                  <span>{p.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {gameDay && (
        <Link className="promo" to={`/products/${gameDay.product_id}`}>
          <span className="promo-tag">Game day</span>
          <span>Harvard–Yale rivalry gear is here: the {gameDay.name}</span>
          <span className="promo-go">See it →</span>
        </Link>
      )}

      {favorites.length > 0 && (
        <section className="band">
          <p className="eyebrow">Fan favorites</p>
          <h2>Start with the classics</h2>
          <ul className="product-grid">
            {favorites.map((p) => (
              <ProductCard key={p.product_id} product={p} />
            ))}
          </ul>
          <p className="more"><Link to="/products">See the whole collection →</Link></p>
        </section>
      )}

      <section className="band">
        <p className="eyebrow">Yale pride on the go</p>
        <h2>Gear that rides along in your bag</h2>
        <CategoryCards items={PRIDE} />
      </section>

      <section className="band">
        <p className="eyebrow">Desk and office</p>
        <h2>Make a long study session feel a little more Yale</h2>
        <CategoryCards items={OFFICE} />
      </section>

      <section className="band pillars-band">
        <p className="eyebrow">What we stand on</p>
        <h2>Three pillars</h2>
        <ul className="pillars">
          {PILLARS.map((p, i) => (
            <li key={p.title}>
              <span className="capital" aria-hidden="true" />
              <div className="shaft">
                <span className="num" aria-hidden="true">{['I', 'II', 'III'][i]}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
              <span className="base" aria-hidden="true" />
            </li>
          ))}
        </ul>
      </section>

      <section className="band visit">
        <p className="eyebrow">Come visit us</p>
        <h2>Say hello in person</h2>
        <address>{STORE.address}</address>
        <p>Not sure what size to grab? Stop by, or ask the shop assistant from any page.</p>
      </section>
    </>
  )
}
