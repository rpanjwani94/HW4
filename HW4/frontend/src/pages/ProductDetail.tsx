import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchProduct, formatPrice } from '../api'
import type { Product } from '../api'
import { STORE } from '../config'
import { useAuth } from '../auth'

export default function ProductDetail() {
  const { productId = '' } = useParams()
  return <ProductView key={productId} productId={productId} />
}

function ProductView({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'not-found' | 'ready'>('loading')

  useEffect(() => {
    fetchProduct(productId)
      .then((p) => {
        setProduct(p)
        setStatus('ready')
      })
      .catch((e: Error) => setStatus(e.message === 'not-found' ? 'not-found' : 'error'))
  }, [productId])

  if (status === 'loading') return <section className="page"><p role="status">Loading…</p></section>
  if (status === 'not-found')
    return (
      <section className="page">
        <h1>Product not found</h1>
        <p><Link to="/products">Back to all products</Link></p>
      </section>
    )
  if (status === 'error' || !product)
    return (
      <section className="page">
        <p className="note error" role="alert">We couldn't load this product. Please try again.</p>
        <p><Link to="/products">Back to all products</Link></p>
      </section>
    )

  const soldOut = product.inventory.filter((i) => i.quantity === 0)

  return (
    <section className="page wide">
      <p><Link to="/products">← All products</Link></p>
      <div className="detail">
        <img className="detail-image" src={product.image_url} alt={product.name} />
        <div>
          <h1>{product.name}</h1>
          <p className="price big">{formatPrice(product.price)}</p>
          <p className="body-text">{product.description}</p>
          <p><strong>Type:</strong> {product.garment_type}</p>
          <p><strong>Colors:</strong> {product.colors.join(', ')}</p>

          <h2>Sizes and stock</h2>
          <table>
            <thead>
              <tr><th scope="col">Size</th><th scope="col">Stock</th></tr>
            </thead>
            <tbody>
              {product.inventory.map((i) => (
                <tr key={i.size}>
                  <th scope="row">{i.size}</th>
                  <td className={i.quantity === 0 ? 'out' : ''}>
                    {i.quantity === 0 ? 'Sold out' : `${i.quantity} in stock`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <BuyNow product={product} />

          <h2>Restocks</h2>
          <p>
            {soldOut.length === 0
              ? 'Every size is in stock right now.'
              : `We don't have a restock date for ${soldOut.map((i) => i.size).join(', ')} yet. Email ${STORE.orderEmail} and we'll let you know when it changes.`}
          </p>
        </div>
      </div>
    </section>
  )
}

function BuyNow({ product }: { product: Product }) {
  const { user } = useAuth()
  const { hash } = useLocation()
  const [size, setSize] = useState('')
  const [error, setError] = useState('')
  const sizes = product.inventory
  const anyInStock = sizes.some((s) => s.quantity > 0)

  useEffect(() => {
    if (hash === '#buy') document.getElementById('buy')?.scrollIntoView?.({ block: 'center' })
  }, [hash])

  function onBuy() {
    if (!size) {
      setError('Please choose a size first.')
      return
    }
    const who = user ? `${user.first_name} ${user.last_name}`.trim() + ` (${user.email})` : '(name and email)'
    const subject = `Order request: ${product.name}, size ${size}`
    const body = [
      'Hello Campus Customs order team,',
      '',
      "I'd like to order:",
      `Item: ${product.name} (${product.product_id})`,
      `Size: ${size}`,
      'Quantity: 1',
      `Price shown: ${formatPrice(product.price)}`,
      '',
      `Name: ${who}`,
      '',
      'Please let me know the next steps. Thank you!',
    ].join('\n')
    window.location.href = `mailto:${STORE.orderEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div id="buy" className="buy-box">
      <h2>Buy now</h2>
      {anyInStock ? (
        <>
          <fieldset>
            <legend>Choose a size</legend>
            <div className="size-options">
              {sizes.map((s) => (
                <label key={s.size} className={`size-option${s.quantity === 0 ? ' disabled' : ''}${size === s.size ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name="size"
                    value={s.size}
                    disabled={s.quantity === 0}
                    checked={size === s.size}
                    onChange={() => {
                      setSize(s.size)
                      setError('')
                    }}
                  />
                  {s.size}
                  {s.quantity === 0 && <small> sold out</small>}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="note error" role="alert">{error}</p>}
          <button className="button" type="button" onClick={onBuy}>Buy now · {formatPrice(product.price)}</button>
          <p><small>Online checkout isn't open yet. Buy now opens an email to our order team with your item and size, and they will complete your order.</small></p>
        </>
      ) : (
        <p className="note">This item is sold out in every size right now.</p>
      )}
    </div>
  )
}
