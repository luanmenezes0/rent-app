import type { ReactNode } from "react";

export default function FormFieldError({ children }: { children: ReactNode }) {
  return (
    <span role="alert" className="text-xs italic text-red-600">
      {children}
    </span>
  );
}
