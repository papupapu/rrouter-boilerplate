import { Link } from "react-router";

import { Search } from "../../components/post/search/search";

export function Post({ name }: { name: string }) {
  return (
    <main className="p--200">
      <div className="tp-w--s">post about: {name}</div>
      <Link to="/">Go to home page</Link>
      <Search />
    </main>
  );
}
