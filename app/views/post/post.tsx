import { Link } from "react-router";

import type { Product } from "~/services/common";

import { Search } from "../../components/post/search/search";

export function Post({ data }: { data: Product }) {
  return (
    <main className="p--200">
      <div className="tp-w--s">post about: {data.title}</div>
      <Link to="/">Go to home page</Link>
      <Search />
    </main>
  );
}
