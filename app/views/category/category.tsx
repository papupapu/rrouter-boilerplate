import { Link } from "react-router";

import type { Product } from "~/services/common";

export function Category({ name, data }: { name: string; data: Product[] }) {
  return (
    <main className="p--200">
      <h2 className="tp-w--m">{name}</h2>

      {/* Product grid - showing first 4 products */}
      <div className="flex gap--200" style={{ flexWrap: "wrap" }}>
        {data.map((product) => (
          <div
            key={product.id}
            className="p--200 c-bg--fourth"
            style={{ width: "200px" }}
          >
            {/* Product image */}
            <img
              src={product.thumbnail}
              alt={product.title}
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
              }}
            />
            {/* Product details */}
            <h3 className="tp-w--s">
              <Link to={`/${name}/${product.id}`}>{product.title}</Link>
            </h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
