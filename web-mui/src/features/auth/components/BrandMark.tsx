import { Box } from "@mui/material";

export function BrandMark() {
  return (
    <Box
      aria-label="SmartFood"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5
      }}
    >
      <Box
        sx={{
          width: 26,
          height: 18,
          position: "relative"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "10px 10px 4px 4px",
            background: "linear-gradient(135deg, #26c281 0%, #169261 100%)",
            clipPath: "polygon(0% 100%, 18% 40%, 32% 72%, 50% 18%, 68% 72%, 82% 40%, 100% 100%, 82% 100%, 68% 66%, 50% 100%, 32% 66%, 18% 100%)"
          }}
        />
      </Box>
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#26c281",
          alignSelf: "flex-end",
          mb: 0.2
        }}
      />
    </Box>
  );
}
