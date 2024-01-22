import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Button, Flex, VisuallyHidden } from "@chakra-ui/react";
import { Link, useSearchParams } from "@remix-run/react";

function setSearchParamsString(
  searchParams: URLSearchParams,
  changes: Record<string, string | number | undefined>,
) {
  const newSearchParams = new URLSearchParams(searchParams);
  console.log(changes);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) {
      newSearchParams.delete(key);
      continue;
    }
    newSearchParams.set(key, String(value));
  }
  // Print string manually to avoid over-encoding the URL
  // Browsers are ok with $ nowadays
  // optional: return newSearchParams.toString()

  console.log(Object.fromEntries(newSearchParams));
  return Array.from(newSearchParams.entries())
    .map(([key, value]) =>
      value ? `${key}=${encodeURIComponent(value)}` : key,
    )
    .join("&");
}

export function PaginationBar({ total }: { total: number }) {
  const [searchParams] = useSearchParams();
  const $skip = Number(searchParams.get("$skip")) || 0;
  const $top = Number(searchParams.get("$top")) || 10;
  const totalPages = Math.ceil(total / $top);
  const currentPage = Math.floor($skip / $top) + 1;
  const maxPages = 7;
  const halfMaxPages = Math.floor(maxPages / 2);
  const canPageBackwards = $skip > 0;
  const canPageForwards = $skip + $top < total;
  const pageNumbers = [] as Array<number>;
  if (totalPages <= maxPages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    let startPage = currentPage - halfMaxPages;
    let endPage = currentPage + halfMaxPages;
    if (startPage < 1) {
      endPage += Math.abs(startPage) + 1;
      startPage = 1;
    }
    if (endPage > totalPages) {
      startPage -= endPage - totalPages;
      endPage = totalPages;
    }
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
  }

  return (
    <Flex justifyContent="center" m="4">
      {/*       <Button size="sm" variant="ghost" disabled={!canPageBackwards}>
        <Link
          to={{
            search: setSearchParamsString(searchParams, {
              $skip: 0,
            }),
          }}
          preventScrollReset
          prefetch="intent"
          className="text-neutral-600"
        >
          <VisuallyHidden> First page</VisuallyHidden>
          <ArrowLeftIcon />
        </Link>
      </Button> */}
      <Button size="sm" variant="ghost" disabled={!canPageBackwards}>
        <Link
          to={{
            search: setSearchParamsString(searchParams, {
              $skip: Math.max($skip - $top, 0),
            }),
          }}
          onClick={() => console.log("oi")}
          preventScrollReset
          // prefetch="intent"
        >
          <VisuallyHidden> Previous page</VisuallyHidden>
          <ChevronLeftIcon />
        </Link>
      </Button>
      {pageNumbers.map((pageNumber) => {
        const pageSkip = (pageNumber - 1) * $top;
        const isCurrentPage = pageNumber === currentPage;
        if (isCurrentPage) {
          return (
            <Button size="sm" variant={"outline"} key={`${pageNumber}-active`}>
              <div>
                <VisuallyHidden>Page {pageNumber}</VisuallyHidden>
                <span>{pageNumber}</span>
              </div>
            </Button>
          );
        } else {
          return (
            <Button size="sm" variant="ghost" key={pageNumber}>
              <Link
                to={{
                  search: setSearchParamsString(searchParams, {
                    $skip: pageSkip,
                  }),
                }}
                preventScrollReset
                // prefetch="intent"
              >
                {pageNumber}
              </Link>
            </Button>
          );
        }
      })}
      <Button size="sm" variant="ghost" disabled={!canPageForwards}>
        <Link
          to={{
            search: setSearchParamsString(searchParams, {
              $skip: $skip + $top,
            }),
          }}
          preventScrollReset
          // prefetch="intent"
        >
          <VisuallyHidden> Next page</VisuallyHidden>
          <ChevronRightIcon />
        </Link>
      </Button>
      {/*       <Button size="sm" variant="ghost" disabled={!canPageForwards}>
        <Link
          to={{
            search: setSearchParamsString(searchParams, {
              $skip: (totalPages - 1) * $top,
            }),
          }}
          preventScrollReset
          prefetch="intent"
          className="text-neutral-600"
        >
          <VisuallyHidden> Last page</VisuallyHidden>
          <ArrowRightIcon />
        </Link>
      </Button> */}
    </Flex>
  );
}
