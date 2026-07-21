import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStaff } from '@/hooks/useStaff';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { initials } from '@/utils/format';
import type { StaffMember } from '@/types/database';

type Draft = {
  full_name: string;
  role_title: string;
  bio: string;
  avatar_url: string;
  active: boolean;
};

const emptyDraft: Draft = {
  full_name: '',
  role_title: 'Hair Stylist',
  bio: '',
  avatar_url: '',
  active: true,
};

export function AdminStaff() {
  const { staff, loading, refetch } = useStaff(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<StaffMember | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (m: StaffMember) => {
    setEditing(m);
    setDraft({
      full_name: m.full_name,
      role_title: m.role_title,
      bio: m.bio,
      avatar_url: m.avatar_url ?? '',
      active: m.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.full_name.trim()) return toast.error('Il nome è obbligatorio');
    setSaving(true);
    const payload = { ...draft, avatar_url: draft.avatar_url || null };
    const { error } = editing
      ? await supabase.from('staff_members').update(payload).eq('id', editing.id)
      : await supabase.from('staff_members').insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Membro aggiornato' : 'Membro aggiunto');
    setOpen(false);
    await refetch();
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('staff_members').delete().eq('id', toDelete.id);
    if (error) {
      toast.error('Membro con appuntamenti collegati: disattivato invece di eliminato.');
      await supabase.from('staff_members').update({ active: false }).eq('id', toDelete.id);
    } else {
      toast.success('Membro eliminato');
    }
    setToDelete(null);
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-serif text-3xl text-brand-900">Staff</h1>
          <p className="mt-1 text-brand-500">Gestisci i membri del team del salone.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuovo membro
        </Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : staff.length === 0 ? (
        <EmptyState title="Nessun membro" action={<Button onClick={openCreate}>Aggiungi</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center gap-4">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.full_name} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 font-semibold text-white">
                    {initials(m.full_name)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-brand-900">{m.full_name}</h3>
                    {!m.active && (
                      <Badge tone="neutral">
                        <EyeOff className="mr-1 h-3 w-3" /> Off
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-accent-600">{m.role_title}</p>
                </div>
              </div>
              {m.bio && <p className="mt-3 line-clamp-2 text-sm text-brand-500">{m.bio}</p>}
              <div className="mt-4 flex gap-2 border-t border-brand-100 pt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" /> Modifica
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setToDelete(m)}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Modifica membro' : 'Nuovo membro'}>
        <div className="space-y-4">
          <Input
            label="Nome e cognome"
            value={draft.full_name}
            onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
          />
          <Input
            label="Ruolo"
            value={draft.role_title}
            onChange={(e) => setDraft({ ...draft, role_title: e.target.value })}
          />
          <Input
            label="URL foto (opzionale)"
            placeholder="https://…"
            value={draft.avatar_url}
            onChange={(e) => setDraft({ ...draft, avatar_url: e.target.value })}
          />
          <Input
            label="Bio"
            value={draft.bio}
            onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-brand-700">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-4 w-4 rounded border-brand-300"
            />
            Attivo (prenotabile)
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button loading={saving} onClick={save}>
              {editing ? 'Salva' : 'Aggiungi'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Eliminare il membro?">
        <p className="text-sm text-brand-600">
          Se ha appuntamenti collegati verrà disattivato anziché eliminato.
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
