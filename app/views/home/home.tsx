/**
 * Home View Component
 *
 * Displays the home page with:
 * - Category sections
 * - Products for each category (first 4 products shown)
 * - Product cards with image, title, and price
 *
 * Data source:
 * - Receives categories and categoryProducts from home route loader
 * - Categories: Initialized at server startup, read from cache (~1ms)
 * - Products: Fetched at runtime for each category in parallel (~400ms)
 * - Products are organized by category slug for easy lookup
 */

import { Link } from "react-router";
import type { Category } from "../../services/categories";
import type { Product } from "../../services/common";

type HomeData = {
  categories: Category[]; // List of all categories
  categoryProducts: Record<string, Product[]>; // Products keyed by category slug
};

export function Home({ data }: { data: HomeData }) {
  return (
    <main className="p--200">
      <div className="tp-w--l">Home</div>
      <Link to="/about">Go to about page</Link>

      {/* Render a section for each category */}
      {data.categories.map((category) => {
        // Get products for this category from the products map
        const products = data.categoryProducts[category.slug] || [];

        return (
          <section key={category.slug} className="p--200">
            {/* Category heading */}
            <h2 className="tp-w--m">{category.name}</h2>

            {/* Product grid - showing first 4 products */}
            <div className="flex gap--200" style={{ flexWrap: "wrap" }}>
              {products.slice(0, 4).map((product) => (
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
                    <Link to={`/${category.slug}/${product.id}`}>
                      {product.title}
                    </Link>
                  </h3>
                  <p>${product.price}</p>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
