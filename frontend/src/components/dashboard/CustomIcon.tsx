import { Box } from "@mui/material";
import { JSX } from "react";

interface CustomIconProps {
  src: string;
  alt: string;
  size?: number;
}

export default function CustomIcon({
  src,
  alt,
  size = 35
}: CustomIconProps): JSX.Element {
  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      sx={{
        width: size,
        height: size,
        objectFit: "contain",
      }}
    />
  );
}
