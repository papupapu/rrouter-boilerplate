import type { Product } from "../../../services/common";

export default function ListingCard({ product }: { product: Product }) {
  const { id, title, description, price, stock, thumbnail, category } = product;
  return (
    <article className="listing-card relative flex flex-column b--md b-r--md c-br--fourth is-anim-borderColor">
      <div className="listing-card__ctn p--200 flex flex-column flex-item-stretch gap--200 bt--md c-br--fourth is-anim-borderColor">
        <h3 className="tp-s--xl tp-w--l">
          <a href={`/${category}/${id}`} title={title}>
            {title}
          </a>
        </h3>
        <p className="tp-s--md tp-w--s tp-ln--lg">{description}</p>
        <div className="flex justify-between tp-s--sm tp-w--l bt--md pt--200 mt--auto c-br--fourth is-anim-borderColor">
          <p>
            <span className="tp-w--m">$</span>
            {price}
          </p>
          <p>
            {stock > 0 ? (
              <>
                {stock} <span className="tp-w--m">in stock</span>
              </>
            ) : (
              <span className="tp-w--m">Out of stock</span>
            )}
          </p>
        </div>
      </div>
      <img
        className="listing-card__img block"
        width="300"
        height="300"
        src={thumbnail}
        alt={title}
      />
    </article>
  );
}
