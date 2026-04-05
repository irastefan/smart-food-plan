import { apiRequest } from "../../../shared/api/http";

export type BodyMeasurements = {
  neckCm: number | null;
  bustCm: number | null;
  underbustCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  forearmCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
};

export type BodyMetricsEntry = {
  id: string;
  userId: string;
  date: string;
  weightKg: number | null;
  measurements: BodyMeasurements | null;
  createdAt: string;
  updatedAt: string;
};

type BackendBodyMetricsEntry = {
  id: string;
  userId: string;
  date: string;
  weightKg?: unknown;
  measurements?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type BackendBodyMetricsHistory = {
  fromDate: string;
  toDate: string;
  items: BackendBodyMetricsEntry[];
};

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapMeasurements(input?: Record<string, unknown> | null): BodyMeasurements | null {
  if (!input) {
    return null;
  }

  const measurements: BodyMeasurements = {
    neckCm: toNumberOrNull(input.neckCm),
    bustCm: toNumberOrNull(input.bustCm),
    underbustCm: toNumberOrNull(input.underbustCm),
    waistCm: toNumberOrNull(input.waistCm),
    hipsCm: toNumberOrNull(input.hipsCm),
    bicepsCm: toNumberOrNull(input.bicepsCm),
    forearmCm: toNumberOrNull(input.forearmCm),
    thighCm: toNumberOrNull(input.thighCm),
    calfCm: toNumberOrNull(input.calfCm)
  };

  const hasAnyValue = Object.values(measurements).some((value) => value !== null);
  return hasAnyValue ? measurements : null;
}

function mapEntry(input: BackendBodyMetricsEntry): BodyMetricsEntry {
  return {
    id: input.id,
    userId: input.userId,
    date: input.date,
    weightKg: toNumberOrNull(input.weightKg),
    measurements: mapMeasurements(input.measurements),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

export async function getBodyMetricsDay(date: string): Promise<BodyMetricsEntry | null> {
  const response = await apiRequest<BackendBodyMetricsEntry | null>(`/v1/body-metrics/daily?date=${encodeURIComponent(date)}`);
  return response ? mapEntry(response) : null;
}

export async function getBodyMetricsHistory(params?: {
  fromDate?: string;
  toDate?: string;
  limitDays?: number;
}): Promise<BodyMetricsEntry[]> {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (typeof params?.limitDays === "number") query.set("limitDays", String(params.limitDays));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiRequest<BackendBodyMetricsHistory>(`/v1/body-metrics/history${suffix}`);
  return (response.items ?? [])
    .map(mapEntry)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function upsertBodyMetrics(input: {
  date: string;
  weightKg?: number | null;
  neckCm?: number | null;
  bustCm?: number | null;
  underbustCm?: number | null;
  waistCm?: number | null;
  hipsCm?: number | null;
  bicepsCm?: number | null;
  forearmCm?: number | null;
  thighCm?: number | null;
  calfCm?: number | null;
}): Promise<BodyMetricsEntry> {
  const payload = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== "")
  );

  const response = await apiRequest<BackendBodyMetricsEntry>("/v1/body-metrics/daily", {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  return mapEntry(response);
}
