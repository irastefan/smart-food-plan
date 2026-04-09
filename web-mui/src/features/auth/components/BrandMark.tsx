import { Box, Typography } from "@mui/material";
import { WellinLogoMark } from "../../../shared/ui/WellinLogoMark";

type BrandMarkProps = {
  showText?: boolean;
};

export function BrandMark({ showText = true }: BrandMarkProps) {
  return (
    <Box
      aria-label="Wellin"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1
      }}
    >
      <WellinLogoMark size={34} />

      {showText ? (
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontSize: 24,
            color: "inherit"
          }}
        >
          Wellin
        </Typography>
      ) : null}
    </Box>
  );
}
