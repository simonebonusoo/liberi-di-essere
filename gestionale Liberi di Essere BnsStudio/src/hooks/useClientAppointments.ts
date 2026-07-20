import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchClientAppointments } from '@/lib/appointments';
import type { AppointmentWithRelations } from '@/types/database';

export function useClientAppointments() {
  const { session } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientAppointments(session.user.id);
      setAppointments(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const now = Date.now();
  const upcoming = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.starts_at).getTime() >= now
  );
  const past = appointments.filter(
    (a) => a.status !== 'confirmed' || new Date(a.starts_at).getTime() < now
  );

  return { appointments, upcoming, past, loading, error, refetch };
}
