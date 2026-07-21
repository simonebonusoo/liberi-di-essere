import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isLocationBookableOnDate } from '@/utils/locations';
import type { Location } from '@/types/database';

export function useLocations(onlyBookable = true) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('locations').select('*').order('sort_order');
    if (onlyBookable) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) setError(error.message);
    else {
      const rows = (data ?? []) as Location[];
      setLocations(onlyBookable ? rows.filter((l) => isLocationBookableOnDate(l, new Date())) : rows);
    }
    setLoading(false);
  }, [onlyBookable]);

  useEffect(() => {
    void fetchLocations();
  }, [fetchLocations]);

  return { locations, loading, error, refetch: fetchLocations };
}
