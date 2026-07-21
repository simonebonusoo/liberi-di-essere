import type { Location } from '@/types/database';

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function isLocationBookableOnDate(location: Location, date: Date): boolean {
  if (!location.active) return false;
  if (!location.seasonal) return true;
  const day = ymd(date);
  if (location.season_start && day < location.season_start) return false;
  if (location.season_end && day > location.season_end) return false;
  return true;
}
