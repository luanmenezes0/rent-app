import { useMemo } from "react";
import { data, useMatches } from "react-router";

import { ZodError } from "zod";
import type { User } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string,
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id],
  );
  return route?.data as Record<string, unknown>;
}

function isUser(user: unknown): user is User {
  return (
    user != null &&
    typeof user === "object" &&
    "email" in user &&
    typeof user.email === "string"
  );
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.",
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function groupBy<T>(arr: T[], fn: (item: T) => any) {
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
    const groupKey = fn(curr);
    const group = prev[groupKey] || [];
    group.push(curr);
    return { ...prev, [groupKey]: group };
  }, {});
}

export const PAGINATION_LIMIT = 20;

export const BuildingSiteStatus = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

export const BuildingSiteStatusLabels: Record<number, string> = {
  [BuildingSiteStatus.ACTIVE]: "Ativa",
  [BuildingSiteStatus.INACTIVE]: "Inativa",
};

export const userRoles = { USER: "USER", ADMIN: "ADMIN" } as const;

export function validationError(errors: Record<string, string>) {
  return data(
    {
      fieldErrors: errors,
    },
    {
      status: 422,
      headers: {
        "Content-Type": "application/json; utf-8",
      },
    },
  );
}

export function parseZodError<T>(error: ZodError<T>): Record<string, string> {
  return error.issues.reduce(
    (acc, issue) => {
      acc[issue.path.join(".")] = issue.message;
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * A generic type for objects where keys are strings and values can be of any type.
 * This is used for the input and intermediate objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = { [key: string]: any };

/**
 * A more specific type for the temporary object used to group array items by their unique ID.
 * The key is the unique ID (as a string), and the value is the object being built.
 */
type TempArrayItems = { [id: string]: AnyObject };

/**
 * Unflattens an object with bracket-notation keys into a new object with a nested array.
 * This function is type-safe and generic.
 *
 * @param {AnyObject} flatObject The flat object to process.
 * Example: { 'items[1].name': 'Book', 'items[2].name': 'Pen' }
 * @param {string} arrayKey The base key for the array property to be created (e.g., 'items').
 * @returns {AnyObject} A new object with the specified key holding the reconstructed array.
 */
export function unflattenObject(flatObject: AnyObject, arrayKey: string): AnyObject {
  const result: AnyObject = {};
  const tempArrayItems: TempArrayItems = {};

  // Regular expression to capture the unique ID and the property name.
  // Example for 'items': /items\[(.*?)\]\.(.*)/
  const regex = new RegExp(`^${arrayKey}\\[(.*?)\\]\\.(.*)`);

  for (const key in flatObject) {
    const match = key.match(regex);

    if (match) {
      const id = match[1]; // The unique identifier inside the brackets
      const property = match[2]; // The property name after the dot

      if (!tempArrayItems[id]) {
        tempArrayItems[id] = {};
      }
      tempArrayItems[id][property] = flatObject[key];
    } else {
      // Copy over keys that are not part of the array
      result[key] = flatObject[key];
    }
  }

  // Convert the temporary object of items into a final array
  result[arrayKey] = Object.values(tempArrayItems);

  return result;
}
