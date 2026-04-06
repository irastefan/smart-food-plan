import { Box, Typography } from "@mui/material";

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
      <Box
        sx={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          position: "relative",
          background: "conic-gradient(from 215deg, #04624f 0deg, #0c8e74 120deg, #26b96d 220deg, #8fe24d 290deg, #04624f 360deg)",
          boxShadow: "inset 0 1px 8px rgba(255,255,255,0.08)"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "18%",
            borderRadius: "50%",
            backgroundColor: "#0f172a"
          }}
        />
      </Box>

      {showText ? (
        <Typography
          sx={{
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            fontSize: 20,
            color: "inherit"
          }}
        >
          Wellin
        </Typography>
      ) : null}
    </Box>
  );
}
