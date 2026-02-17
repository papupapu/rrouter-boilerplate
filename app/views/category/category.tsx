import { Link } from "react-router";

import type { Product } from "~/services/common";

export function Category({ name, data }: { name: string; data: Product[] }) {
  console.log(data);
  return (
    <main className="p--200">
      <div className="tp-w--s">category: {name}</div>
      <Link to="/">Go to home page</Link>
    </main>
  );
}
