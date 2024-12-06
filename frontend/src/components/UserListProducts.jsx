import React, { useState } from "react";

const UserListProducts = ({ products }) => {
  return (
    <div>
      <h1>Lista produktów</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id} style={{ marginBottom: "20px" }}>
            <div>
              <h3>{product.name}</h3>
              <p>{product.description || "Brak opisu"}</p>
              <p>Cena: {product.price} PLN</p>
              <p>{product.is_available ? "Dostępny" : "Niedostępny"}</p>
            </div>
            <AddToCartButton productId={product.id} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const AddToCartButton = ({ productId }) => {
  const [quantity, setQuantity] = useState(1);

  const handleIncrease = () => {
    if (quantity < 9) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    alert(`Dodano do koszyka: Produkt ID ${productId}, Ilość: ${quantity}`);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <button onClick={handleDecrease} disabled={quantity === 1}>
        -
      </button>
      <span>{quantity}</span>
      <button onClick={handleIncrease} disabled={quantity === 9}>
        +
      </button>
      <button onClick={handleAddToCart}>Dodaj do koszyka</button>
    </div>
  );
};

export default UserListProducts;
