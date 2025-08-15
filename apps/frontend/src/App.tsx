import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  id: number;
  quantity: number;
}

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data.map((product: any) => ({ ...product, quantity: 0 })));
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ text: 'Failed to load products', type: 'error' });
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId ? { ...product, quantity } : product
      )
    );
  };

  const addToCart = () => {
    const items = products
      .filter(product => product.quantity > 0)
      .map(product => ({ id: product.id, quantity: product.quantity }));
    
    setCart(items);
  };

  const checkout = async () => {
    if (cart.length === 0) {
      setMessage({ text: 'Please add items to cart first', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/requests', {
        userId: 1, // Hardcoded for demo
        products: cart
      });

      setMessage({ 
        text: `Order created successfully! Request ID: ${response.data.id}`, 
        type: 'success' 
      });
      
      // Reset cart
      setCart([]);
      setProducts(prev => prev.map(product => ({ ...product, quantity: 0 })));
    } catch (error) {
      console.error('Error creating order:', error);
      setMessage({ text: 'Failed to create order', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.id);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  return (
    <div className="container">
      <h1>ShopFlow Shopper</h1>
      
      {message && (
        <div className={`status ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2>Products</h2>
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-item">
              <h3>{product.name}</h3>
              <p>Price: ${product.price}</p>
              <input
                type="number"
                min="0"
                value={product.quantity}
                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                className="quantity-input"
                placeholder="Qty"
              />
            </div>
          ))}
        </div>
        
        <button onClick={addToCart} className="button">
          Add to Cart
        </button>
      </div>

      {cart.length > 0 && (
        <div className="card">
          <h2>Cart</h2>
          <p>Total Items: {totalItems}</p>
          <p>Total Price: ${totalPrice.toFixed(2)}</p>
          
          <button 
            onClick={checkout} 
            className="button" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
