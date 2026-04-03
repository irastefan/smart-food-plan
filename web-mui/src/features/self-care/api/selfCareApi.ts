import { apiRequest } from "../../../shared/api/http";

export type SelfCareWeekdayKey =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SelfCareItem = {
  id: string;
  title: string;
  description: string;
  note: string;
  order: number;
};

export type SelfCareSlot = {
  id: string;
  weekday: SelfCareWeekdayKey;
  name: string;
  order: number;
  items: SelfCareItem[];
};

export type SelfCareWeekday = {
  weekday: SelfCareWeekdayKey;
  slots: SelfCareSlot[];
};

export type SelfCareRoutineWeek = {
  weekdays: SelfCareWeekday[];
};

type BackendSelfCareItem = {
  id?: string;
  itemId?: string;
  title?: string;
  description?: string | null;
  note?: string | null;
  order?: number;
};

type BackendSelfCareSlot = {
  id?: string;
  slotId?: string;
  weekday?: string;
  name?: string;
  order?: number;
  items?: BackendSelfCareItem[];
};

type BackendSelfCareWeekday = {
  weekday?: string;
  slots?: BackendSelfCareSlot[];
};

type BackendSelfCareWeek = {
  weekdays?: BackendSelfCareWeekday[];
};

const WEEKDAY_ORDER: SelfCareWeekdayKey[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
];

function toWeekdayKey(value: unknown): SelfCareWeekdayKey {
  const normalized = String(value ?? "").toUpperCase();
  return WEEKDAY_ORDER.includes(normalized as SelfCareWeekdayKey)
    ? normalized as SelfCareWeekdayKey
    : "MONDAY";
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapItem(item: BackendSelfCareItem, index: number): SelfCareItem {
  return {
    id: item.id ?? item.itemId ?? `self-care-item-${index + 1}`,
    title: item.title?.trim() || "Step",
    description: item.description?.trim() || "",
    note: item.note?.trim() || "",
    order: toNumber(item.order) || index + 1
  };
}

function mapSlot(slot: BackendSelfCareSlot, weekday: SelfCareWeekdayKey, index: number): SelfCareSlot {
  const items = (slot.items ?? [])
    .map((item, itemIndex) => mapItem(item, itemIndex))
    .sort((left, right) => left.order - right.order);

  return {
    id: slot.id ?? slot.slotId ?? `${weekday.toLowerCase()}-slot-${index + 1}`,
    weekday,
    name: slot.name?.trim() || "Routine",
    order: toNumber(slot.order) || index + 1,
    items
  };
}

function mapWeek(response: BackendSelfCareWeek): SelfCareRoutineWeek {
  const byWeekday = new Map<SelfCareWeekdayKey, SelfCareSlot[]>();

  for (const weekdayEntry of response.weekdays ?? []) {
    const weekday = toWeekdayKey(weekdayEntry.weekday);
    const slots = (weekdayEntry.slots ?? [])
      .map((slot, index) => mapSlot(slot, weekday, index))
      .sort((left, right) => left.order - right.order);
    byWeekday.set(weekday, slots);
  }

  return {
    weekdays: WEEKDAY_ORDER.map((weekday) => ({
      weekday,
      slots: byWeekday.get(weekday) ?? []
    }))
  };
}

export async function getSelfCareRoutineWeek(): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>("/v1/self-care-routines");
  return mapWeek(response);
}

export async function createSelfCareSlot(input: {
  weekday: SelfCareWeekdayKey;
  name: string;
  order?: number;
}): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>("/v1/self-care-routines/slots", {
    method: "POST",
    body: JSON.stringify(input)
  });
  return mapWeek(response);
}

export async function updateSelfCareSlot(
  slotId: string,
  input: Partial<{
    weekday: SelfCareWeekdayKey;
    name: string;
    order: number;
  }>
): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>(`/v1/self-care-routines/slots/${encodeURIComponent(slotId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return mapWeek(response);
}

export async function deleteSelfCareSlot(slotId: string): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>(`/v1/self-care-routines/slots/${encodeURIComponent(slotId)}`, {
    method: "DELETE"
  });
  return mapWeek(response);
}

export async function createSelfCareItem(
  slotId: string,
  input: {
    title: string;
    description?: string;
    note?: string;
    order?: number;
  }
): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>(`/v1/self-care-routines/slots/${encodeURIComponent(slotId)}/items`, {
    method: "POST",
    body: JSON.stringify(input)
  });
  return mapWeek(response);
}

export async function updateSelfCareItem(
  itemId: string,
  input: Partial<{
    title: string;
    description: string;
    note: string;
    order: number;
  }>
): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>(`/v1/self-care-routines/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
  return mapWeek(response);
}

export async function deleteSelfCareItem(itemId: string): Promise<SelfCareRoutineWeek> {
  const response = await apiRequest<BackendSelfCareWeek>(`/v1/self-care-routines/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE"
  });
  return mapWeek(response);
}

export const selfCareWeekdayOrder = WEEKDAY_ORDER;

export function getCurrentWeekdayKey(): SelfCareWeekdayKey {
  const day = new Date().getDay();
  return WEEKDAY_ORDER[(day + 6) % 7];
}
