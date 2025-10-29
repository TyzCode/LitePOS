import './ProductCard.css';

export default function ProductCard({ product, addToCart }) {

    const handleAdd = () => addToCart(product);
    const onKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAdd();
        }
    };

    return (
    <div className="product-card" role='button' tabIndex={0} onClick={handleAdd} onKeyDown={onKeyDown}>
      <div className="product-image" aria-hidden>
        {product.image ? <img src={product.image} alt={product.name} /> : <div className="placeholder">☕</div>}
      </div>

      <div className="product-body">
        <h3 className="product-title">{product.name}</h3>
        {product.description && <p className="product-desc">{product.description}</p>}
        <div className="product-meta">
          <div className="product-price">₱{Number(product.price).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}