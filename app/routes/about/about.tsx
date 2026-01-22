import { About } from "../../views/about/about";

export function meta() {
  return [
    { title: "About" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function AboutRoute() {
  return <About />;
}
