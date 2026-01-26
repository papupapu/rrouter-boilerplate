import { Link } from "react-router";

export function Home() {
  return (
    <main className="home p--200">
      <div className="tp-w--s">home</div>
      <Link to="/about">Go to about page</Link>
    </main>
  );
}
