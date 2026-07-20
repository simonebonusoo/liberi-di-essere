import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useServices } from '@/hooks/useServices';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDuration, formatPrice } from '@/utils/format';
import type { Service } from '@/types/database';

type Draft = {
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  price: number;
  active: boolean;
};

const emptyDraft: Draft = {
  name: '',
  category: 'Generale',
  description: '',
  duration_minutes: 30,
  price: 0,
  active: true,
};

export function AdminServices() {
  const { services, loading, refetch } = useServices(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setDraft({
      name: s.name,
      category: s.category,
      description: s.description,
      duration_minutes: s.duration_minutes,
      price: Number(s.price),
      active: s.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim() || draft.duration_minutes <= 0) {
      toast.error('Nome e durata sono obbligatori');
      return;
    }
    setSaving(true);
    const payload = { ...draft, price: Number(draft.price) };
    const { error } = editing
      ? await supabase.from('services').update(payload).eq('id', editing.id)
      : await supabase.from('services').insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Servizio aggiornato' : 'Servizio creato');
    setOpen(false);
    await refetch();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('services').delete().eq('id', toDelete.id);
    if (error) {
      // FK restrict: se ci sono appuntamenti, disattiva invece di eliminare
      toast.error('Servizio con appuntamenti collegati: disattivato invece di eliminato.');
      await supabase.from('services').update({ active: false }).eq('id', toDelete.id);
    } else {
      toast.success('Servizio eliminato');
    }
    setToDelete(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-serif text-3xl text-brand-900">Servizi</h1>
          <p className="mt-1 text-brand-500">Crea, modifica o disattiva i servizi del listino.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuovo servizio
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : services.length === 0 ? (
        <EmptyState title="Nessun servizio" action={<Button onClick={openCreate}>Crea il primo</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs font-semibold uppercase text-accent-600">{s.category}</span>
                  <h3 className="heading-serif text-lg text-brand-900">{s.name}</h3>
                </div>
                {!s.active && (
                  <Badge tone="neutral">
                    <EyeOff className="mr-1 h-3 w-3" /> Off
                  </Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-brand-500">{s.description}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-brand-500">{formatDuration(s.duration_minutes)}</span>
                <span className="font-bold text-brand-800">{formatPrice(s.price)}</span>
              </div>
              <div className="mt-4 flex gap-2 border-t border-brand-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="h-3.5 w-3.5" /> Modifica
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(s)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crea/modifica */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifica servizio' : 'Nuovo servizio'}>
        <div className="space-y-4">
          <Input
            label="Nome"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            label="Categoria"
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />
          <Input
            label="Descrizione"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Durata (min)"
              type="number"
              min={5}
              step={5}
              value={draft.duration_minutes}
              onChange={(e) => setDraft({ ...draft, duration_minutes: Number(e.target.value) })}
            />
            <Input
              label="Prezzo (€)"
              type="number"
              min={0}
              step={1}
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-700">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-4 w-4 rounded border-brand-300"
            />
            Attivo (visibile nella prenotazione)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? 'Salva modifiche' : 'Crea servizio'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Conferma eliminazione */}
      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Eliminare il servizio?">
        <p className="text-sm text-brand-600">
          Se il servizio ha appuntamenti collegati verrà disattivato anziché eliminato.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Annulla
          </Button>
          <Button variant="danger" onClick={remove}>
            Elimina
          </Button>
        </div>
      </Modal>
    </div>
  );
}
