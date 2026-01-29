import type { Route } from "./+types/post";

import * as postServices from "../services/post";

import { Post } from "../views/post/post";

export function meta() {
  return [
    { title: "Post" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const product = await postServices.getDataBySlug(params.slug);
  return product;
}

export default function PostRoute({ loaderData }: Route.ComponentProps) {
  return <Post data={loaderData} />;
}
