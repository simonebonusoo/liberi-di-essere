import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Service } from '@/types/database';

/** Carica i servizi. Con onlyActive=true (default) filtra quelli disattivati. */
export function useServices(onlyActive = true) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('services').select('*').order('sort_order');
    if (onlyActive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setServices((data ?? []) as Service[]);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  return { services, loading, error, refetch: fetchServices };
}
