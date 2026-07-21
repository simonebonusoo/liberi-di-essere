import { describe, expect, it } from 'vitest';
import { isLocationBookableOnDate } from '@/utils/locations';
import type { Location } from '@/types/database';

const seasonalLocation: Location = {
  id: 'loc-seasonal',
  name: 'Sant Isidoro',
  address: 'Sant Isidoro',
  directions: '',
  phone: null,
  email: null,
  map_url: null,
  image_url: null,
  active: true,
  seasonal: true,
  show_when_inactive: true,
  season_start: '2030-06-15',
  season_end: '2030-09-15',
  max_simultaneous_appointments: 2,
  info_message: '',
  sort_order: 1,
  created_at: '',
  updated_at: '',
};

describe('isLocationBookableOnDate', () => {
  it('allows active seasonal locations inside the configured period', () => {
    expect(isLocationBookableOnDate(seasonalLocation, new Date(2030, 6, 20))).toBe(true);
  });

  it('blocks seasonal locations outside the configured period', () => {
    expect(isLocationBookableOnDate(seasonalLocation, new Date(2030, 11, 1))).toBe(false);
  });

  it('blocks inactive locations', () => {
    expect(isLocationBookableOnDate({ ...seasonalLocation, active: false }, new Date(2030, 6, 20))).toBe(false);
  });
});
