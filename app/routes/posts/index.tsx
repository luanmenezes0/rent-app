import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getPosts } from "~/models/post.server";

type LoaderData = {
  posts: Awaited<ReturnType<typeof getPosts>>;
};

export const loader: LoaderFunction = async () => {
  return json<LoaderData>({ posts: await getPosts() });
};

export default function Posts() {
  const { posts } = useLoaderData<LoaderData>();

  return (
    <main className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">Posts</h1>
      <Link to="admin" className="text-red-600 underline">
        Admin
      </Link>
      <ul>
        {posts.map((p) => (
          <li key={p.title}>
            <Link to={`/posts/${p.slug}`}>{p.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
