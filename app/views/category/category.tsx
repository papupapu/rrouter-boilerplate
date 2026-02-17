import { Link } from "react-router";

export function Category({ name }: { name: string }) {
  return (
    <main className="p--200">
      <div className="tp-w--s">category: {name}</div>
      <Link to="/">Go to home page</Link>
    </main>
  );
}
