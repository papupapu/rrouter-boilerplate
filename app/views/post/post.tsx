import { Link } from "react-router";

export function Post({ name }: { name: string }) {
  return (
    <main className="p--200">
      <div className="tp-w--s">post about: {name}</div>
      <Link to="/about">Go to about page</Link>
    </main>
  );
}
