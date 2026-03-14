import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { useLanguage } from "../app/providers/LanguageProvider";
import { DashboardTopbar } from "../widgets/dashboard/DashboardTopbar";

type LayoutContext = {
  openSidebar: () => void;
  collapsed: boolean;
};

export function DashboardPlaceholderPage({ titleKey }: { titleKey: "nav.recipes" | "nav.products" | "nav.shopping" | "nav.settings" }) {
  const { t } = useLanguage();
  const { openSidebar } = useOutletContext<LayoutContext>();

  return (
    <Stack flex={1} spacing={3}>
      <DashboardTopbar onOpenSidebar={openSidebar} title={t(titleKey)} subtitle={t("common.comingSoon")} />
      <Stack flex={1} justifyContent="center" alignItems="center">
      <Card sx={{ maxWidth: 520, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" mb={1.5}>
            {t(titleKey)}
          </Typography>
          <Typography color="text.secondary">{t("common.comingSoon")}</Typography>
        </CardContent>
      </Card>
      </Stack>
    </Stack>
  );
}
