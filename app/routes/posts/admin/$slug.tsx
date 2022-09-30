import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from "@remix-run/react";
import { marked } from "marked";
import invariant from "tiny-invariant";

import { useRef } from "react";
import type { Post } from "~/models/post.server";
import { deletePost } from "~/models/post.server";
import { editPost, getPost } from "~/models/post.server";
import { requireUserId } from "~/session.server";

type LoaderData = { post: Post; html: string };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  const html = marked(post.markdown);
  return json<LoaderData>({ post, html });
};

type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  await requireUserId(request);

  const formData = await request.formData();

  let action = formData.get("action");

  switch (action) {
    case "update": {
      const title = formData.get("title");
      const slug = formData.get("slug");
      const markdown = formData.get("markdown");

      const errors: ActionData = {
        title: title ? null : "Title is required",
        slug: slug ? null : "Slug is required",
        markdown: markdown ? null : "Markdown is required",
      };

      const hasErrors = Object.values(errors).some(
        (errorMessage) => errorMessage
      );

      if (hasErrors) {
        return json<ActionData>(errors);
      }

      invariant(typeof title === "string", "title must be a string");
      invariant(typeof slug === "string", "slug must be a string");
      invariant(typeof markdown === "string", "markdown must be a string");

      await editPost({ title, slug, markdown });

      return null;
    }

    case "delete": {
      const slug = formData.get("slug") as string;

      await deletePost(slug);

      return redirect("/posts/admin");
    }

    default: {
      throw new Error("Unexpected action");
    }
  }
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function PostSlug() {
  const { post } = useLoaderData<LoaderData>();
  const formRef = useRef<null | HTMLFormElement>(null);
  const errors = useActionData();

  const transition = useTransition();
  const isCreating = Boolean(transition.submission);

  return (
    <div key={post.slug}>
      <Form method="delete">
        <input type="hidden" name="slug" defaultValue={post.slug} />
        <button
          name="action"
          value="delete"
          className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
        >
          Delete
        </button>
      </Form>

      <Form ref={formRef} method="put">
        <p>
          <label>
            Post Title:{" "}
            {errors?.title ? (
              <em className="text-red-600">{errors.title}</em>
            ) : null}
            <input
              type="text"
              name="title"
              defaultValue={post.title}
              className={inputClassName}
              required
            />
          </label>
        </p>
        <p>
          <label>
            Post Slug:{" "}
            {errors?.slug ? (
              <em className="text-red-600">{errors.slug}</em>
            ) : null}
            <input
              type="text"
              name="slug"
              defaultValue={post.slug}
              className={inputClassName}
              required
            />
          </label>
        </p>
        <p>
          <label htmlFor="markdown">Markdown:</label>
          {errors?.markdown ? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}
          <br />
          <textarea
            id="markdown"
            name="markdown"
            className={`${inputClassName} h-14 font-mono`}
            defaultValue={post.markdown}
            required
            rows={20}
          />
        </p>
        <p className="text-right">
          <button
            name="action"
            value="update"
            type="submit"
            className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create/Edit Post"}
          </button>
        </p>
      </Form>
    </div>
  );
}
