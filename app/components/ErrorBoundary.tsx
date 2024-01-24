import { Box, Text } from "@chakra-ui/react";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";

export function ErrorBoundary() {
  const error = useRouteError();

  let content = <h1>Unknown Error</h1>;

  if (isRouteErrorResponse(error)) {
    content = (
      <>
        <Text fontSize="md" fontWeight="bold">
          {error.status} {error.statusText}
        </Text>
        <Text>{error.data}</Text>
      </>
    );
  } else if (error instanceof Error) {
    console.log(error);
    content = (
      <>
        <Text fontSize="md" fontWeight="bold">
          Error
        </Text>
        <Text>{error.message}</Text>
        <Text>The stack trace is:</Text>
        <pre>{error.stack}</pre>
      </>
    );
  }

  return (
    <Box p={4} borderWidth="1px" bg="red.100" color="red.700" mb={4}>
      {content}
    </Box>
  );
}
