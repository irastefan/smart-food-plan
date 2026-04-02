import { Typography } from "@mui/material";

type PageTitleProps = {
  title: string;
};

export function PageTitle({ title }: PageTitleProps) {
  return (
    <Typography
      variant="h4"
      sx={{
        fontSize: { xs: "1.5rem", md: "1.8rem" },
        lineHeight: 1.1,
        fontWeight: 800,
        textAlign: "start"
      }}
    >
      {title}
    </Typography>
  );
}
