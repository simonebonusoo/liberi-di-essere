import { useEffect, useMemo, useState } from 'react';
import { Search, Mail, Phone, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { initials, formatDateShort } from '@/utils/format';
import type { Profile } from '@/types/database';

interface ClientRow extends Profile {
  appointmentsCount: number;
}

export function AdminClients() {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: profiles }, { data: appts }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('client_id'),
      ]);
      const counts = new Map<string, number>();
      (appts ?? []).forEach((a: { client_id: string }) => {
        counts.set(a.client_id, (counts.get(a.client_id) ?? 0) + 1);
      });
      setClients(
        ((profiles ?? []) as Profile[]).map((p) => ({
          ...p,
          appointmentsCount: counts.get(p.id) ?? 0,
        }))
      );
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
    );
  }, [clients, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-serif text-3xl text-brand-900">Clienti</h1>
        <p className="mt-1 text-brand-500">{clients.length} utenti registrati.</p>
      </div>

      <div className="max-w-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-400" />
          <Input
            className="pl-9"
            placeholder="Cerca per nome, email o telefono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nessun cliente trovato" />
      ) : (
        <Card padded={false} className="divide-y divide-brand-100">
          {filtered.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                {initials(c.full_name || c.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-brand-900">{c.full_name || 'Senza nome'}</p>
                  {c.role === 'admin' && (
                    <Badge tone="accent">
                      <Shield className="mr-1 h-3 w-3" /> Admin
                    </Badge>
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-brand-500">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {c.email}
                  </span>
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {c.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-brand-900">{c.appointmentsCount} appuntamenti</p>
                <p className="text-brand-400">Dal {formatDateShort(c.created_at)}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
