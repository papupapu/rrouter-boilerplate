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

import type { Category } from "../../services/categories";
import type { Product } from "../../services/common";
import Aside from "../../components/layout/aside/aside";

import Card from "../../components/listing/card/card";

type HomeData = {
  categories: Category[]; // List of all categories
  categoryProducts: Record<string, Product[]>; // Products keyed by category slug
};

export function Home({ data }: { data: HomeData }) {
  return (
    <div className="three-columns flex-item-stretch flex">
      <main className="flex-item-stretch pt--200 pb--200 flex flex-column">
        {/* Render a section for each category */}
        {data.categories.map((category) => {
          // Get products for this category from the products map
          const products = data.categoryProducts[category.slug] || [];

          return (
            <section
              key={category.slug}
              className="flex flex-column gap--150 mr--auto ml--auto w--100"
            >
              {/* Category heading */}
              <h2 className="cat_heading tp-s--xs tp-w--m tp--up">
                {category.name}
              </h2>

              {/* Product grid - showing first 4 products */}
              <div className="mobile__carousel flex">
                {products.slice(0, 3).map((product) => (
                  <Card key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <Aside>
        <div className="flex flex-column gap--300">
          <h3 className="tp-s--xs tp-w--l c-txt--secondary">
            Something we think it&apos;s worth a look
          </h3>
          <article className="flex flex-column gap--100 pb--300 bb--md c-br--fourth">
            <h1 className="tp-s--md tp-w--l c-txt--primary">The title</h1>
            <p className="tp-s--sm tp-w--s c-txt--secondary tp-ln--lg">
              The Disney movie The Little Mermaid was first released to theatres
              in 1989. The movie earned $87 million during its initial release.
            </p>
            <aside>
              <p className="tp-s--xs tp-w--s c-txt--secondary">
                by <span className="tp-w--m">John Doe</span>
              </p>
            </aside>
          </article>
          <article className="flex flex-column gap--100 pb--300 bb--md c-br--fourth">
            <h1 className="tp-s--md tp-w--l c-txt--primary">The title</h1>
            <p className="tp-s--sm tp-w--s c-txt--secondary tp-ln--lg">
              The Disney movie The Little Mermaid was first released to theatres
              in 1989. The movie earned $87 million during its initial release.
            </p>
            <aside>
              <p className="tp-s--xs tp-w--s c-txt--secondary">
                by <span className="tp-w--m">John Doe</span>
              </p>
            </aside>
          </article>
          <article className="flex flex-column gap--100">
            <h1 className="tp-s--md tp-w--l c-txt--primary">The title</h1>
            <p className="tp-s--sm tp-w--s c-txt--secondary tp-ln--lg">
              The Disney movie The Little Mermaid was first released to theatres
              in 1989. The movie earned $87 million during its initial release.
            </p>
            <aside>
              <p className="tp-s--xs tp-w--s c-txt--secondary">
                by <span className="tp-w--m">John Doe</span>
              </p>
            </aside>
          </article>
          <div className="mt--200 mb--200 c-bg--fourth p--300 b-r--md">
            <p className="tp-s--md tp-w--s c-txt--primary tp-ln--lg">
              The Disney movie The Little Mermaid was first released to theatres
              in 1989. The movie earned $87 million during its initial release.
            </p>
          </div>
          <h3 className="tp-s--xs tp-w--l c-txt--secondary">
            Something we think it&apos;s worth a look
          </h3>
          <ul className="flex flex-column gap--100">
            <li className="flex gap--150 items-center">
              <span className="c-bg--fourth p--200 b-r--pill" />
              <p className="tp-s--sm tp-w--s c-txt--secondary">Item 1</p>
            </li>
            <li className="flex gap--150 items-center">
              <span className="c-bg--fourth p--200 b-r--pill" />
              <p className="tp-s--sm tp-w--s c-txt--secondary">Item 2</p>
            </li>
            <li className="flex gap--150 items-center">
              <span className="c-bg--fourth p--200 b-r--pill" />
              <p className="tp-s--sm tp-w--s c-txt--secondary">Item 3</p>
            </li>
            <li className="flex gap--150 items-center">
              <span className="c-bg--fourth p--200 b-r--pill" />
              <p className="tp-s--sm tp-w--s c-txt--secondary">Item 4</p>
            </li>
            <li className="flex gap--150 items-center">
              <span className="c-bg--fourth p--200 b-r--pill" />
              <p className="tp-s--sm tp-w--s c-txt--secondary">Item 4</p>
            </li>
          </ul>
          <div className="flex flex-column gap--50 pb--400">
            <h3 className="pt--200 tp-s--xs tp-w--l c-txt--secondary">
              Meaningfull infos
            </h3>
            <p className="tp-s--xs tp-w--s c-txt--primary tp-ln--lg">
              The Disney movie The Little Mermaid was first released to theatres
              in 1989. The movie earned $87 million during its initial release.
            </p>
          </div>
        </div>
      </Aside>
    </div>
  );
}
