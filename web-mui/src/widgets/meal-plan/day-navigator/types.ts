export type MealPlanDayNavigatorProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export type DayNavigatorSharedProps = {
  locale: string;
};
