import { Link } from "@remix-run/react";

export default function AdminIndex() {
  return (
    <p className="bg-blue-100">
      <Link to="new" className="text-blue-600 underline ">
        Create a New Post
      </Link>
    </p>
  );
}