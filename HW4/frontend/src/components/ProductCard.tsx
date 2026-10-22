import { Link } from 'react-router-dom'
import { formatPrice, shortDescription } from '../api'
import type { Product } from '../api'
import { stockBadge, swatch } from '../shop'

export default function ProductCard({ product }: { product: Product }) {
  const badge = stockBadge(product)
  return (
    <li>
      <Link className="product-card" to={`/products/${product.product_id}`}>
        <div className="frame">
          <img src={product.image_url} alt={product.name} loading="lazy" />
          {badge && <span className={`badge${badge === 'Sold out' ? ' out' : ''}`}>{badge}</span>}
        </div>
        <div className="product-card-body">
          <p className="eyebrow">{product.garment_type}</p>
          <h2>{product.name}</h2>
          <p className="blurb">{shortDescription(product.description, 80)}</p>
          <div className="card-foot">
            <span className="price">{formatPrice(product.price)}</span>
            <span className="swatches" aria-label={`Colors: ${product.colors.join(', ')}`}>
              {product.colors.slice(0, 4).map((c) => (
                <i key={c} style={{ background: swatch(c) }} title={c} />
              ))}
            </span>
          </div>
        </div>
      </Link>
    </li>
  )
}
