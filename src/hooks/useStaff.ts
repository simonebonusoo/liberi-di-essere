import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StaffMember } from '@/types/database';

export function useStaff(onlyActive = true) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('staff_members').select('*').order('sort_order');
    if (onlyActive) query = query.eq('active', true);
    const { data, error } = await query;
    if (error) setError(error.message);
    else setStaff((data ?? []) as StaffMember[]);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  return { staff, loading, error, refetch: fetchStaff };
}
