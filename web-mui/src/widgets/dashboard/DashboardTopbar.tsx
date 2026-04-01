type DashboardTopbarProps = {
  onOpenSidebar: () => void;
  title?: string;
  subtitle?: string;
};

export function DashboardTopbar({ onOpenSidebar }: DashboardTopbarProps) {
  void onOpenSidebar;
  return null;
}
