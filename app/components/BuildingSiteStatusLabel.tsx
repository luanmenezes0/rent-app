import { Box } from "@chakra-ui/react";

import { BuildingSiteStatus, BuildingSiteStatusLabels } from "~/utils";

export default function BuildingSiteStatusLabel({
  status,
}: {
  status: number;
}) {
  const isActive = status === BuildingSiteStatus.ACTIVE;

  return (
    <Box
      fontSize="14px"
      fontWeight="bold"
      textAlign="center"
      borderRadius="8px"
      px="2"
      color="white"
      bg={isActive ? "green" : "red"}
    >
      {BuildingSiteStatusLabels[status]}
    </Box>
  );
}
