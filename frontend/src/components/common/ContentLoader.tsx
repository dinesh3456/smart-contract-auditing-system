import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

interface ContentLoaderProps {
  type?: "card" | "list" | "detail";
  count?: number;
}

const ContentLoader: React.FC<ContentLoaderProps> = ({
  type = "card",
  count = 1,
}) => {
  const renderCardLoader = () => (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Skeleton
        variant="rectangular"
        height={200}
        sx={{ mb: 1, borderRadius: 2 }}
      />
      <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
      <Skeleton variant="text" width="80%" />
    </Box>
  );

  const renderListLoader = () => (
    <Box sx={{ width: "100%", mb: 1 }}>
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
    </Box>
  );

  const renderDetailLoader = () => (
    <Box sx={{ width: "100%" }}>
      <Skeleton variant="text" height={60} sx={{ mb: 2 }} />
      <Skeleton
        variant="rectangular"
        height={200}
        sx={{ mb: 2, borderRadius: 2 }}
      />
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
      </Stack>
      <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
    </Box>
  );

  const loaderMap = {
    card: renderCardLoader,
    list: renderListLoader,
    detail: renderDetailLoader,
  };

  const loaderRenderer = loaderMap[type];

  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <React.Fragment key={index}>{loaderRenderer()}</React.Fragment>
        ))}
    </>
  );
};

export default ContentLoader;
