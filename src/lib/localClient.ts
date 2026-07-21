/**
 * Client locale che imita la superficie di @supabase/supabase-js usata dall'app
 * (from().select().eq()..., auth, channel realtime). Persiste su localStorage.
 * Usato in MODALITÀ DEMO quando non ci sono credenziali Supabase valide.
 */
import { buildDemoDb, demoUsers, type DemoUser } from '@/lib/demoData';

const DB_KEY = 'bns_liberi_essere_demo_db_v2';
const SESSION_KEY = 'bns_demo_session_v1';
const USERS_KEY = 'bns_liberi_essere_demo_users_v2';

type Row = Record<string, any>;
type Db = Record<string, Row[]>;

function loadDb(): Db {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  const seed = buildDemoDb() as unknown as Db;
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  return seed;
}
function saveDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}
function loadUsers(): DemoUser[] {
  const raw = localStorage.getItem(USERS_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  return [...demoUsers];
}
function saveUsers(u: DemoUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}

export function resetLocalDemoData() {
  const seed = buildDemoDb() as unknown as Db;
  localStorage.setItem(DB_KEY, JSON.stringify(seed));
  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  localStorage.removeItem(SESSION_KEY);
}

function uid() {
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
const nowIso = () => new Date().toISOString();

// ---- Realtime bus (solo notifiche) -----------------------------------------
type Sub = { table: string; userId: string | null; cb: (p: { new: Row }) => void };
const subs: Sub[] = [];
function emitInsert(table: string, row: Row) {
  subs.forEach((s) => {
    if (s.table === table && (!s.userId || s.userId === row.user_id)) s.cb({ new: row });
  });
}

// ---- Notifiche (equivalente del trigger SQL) --------------------------------
function pushNotification(db: Db, n: Row) {
  const full = { id: uid(), read: false, appointment_id: null, type: 'system', message: '', created_at: nowIso(), ...n };
  db.notifications.push(full);
  emitInsert('notifications', full);
}
function notifyOnAppointment(db: Db, appt: Row, event: 'insert' | 'cancel') {
  const service = db.services.find((s) => s.id === appt.service_id);
  const client = db.profiles.find((p) => p.id === appt.client_id);
  const location = db.locations?.find((l) => l.id === appt.location_id);
  const when = new Date(appt.starts_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const admins = db.profiles.filter((p) => ['admin', 'salon_admin', 'super_admin'].includes(p.role));
  const sName = service?.name ?? 'Servizio';
  const lName = location?.name ?? 'Sede';
  const cName = client?.full_name || client?.email || 'Cliente';
  if (event === 'insert') {
    pushNotification(db, { user_id: appt.client_id, title: 'Prenotazione confermata', message: `${sName} il ${when} presso ${lName} è confermato in ambiente demo.`, type: 'booking_created', delivery_status: 'demo_simulated', appointment_id: appt.id });
    admins.forEach((a) => pushNotification(db, { user_id: a.id, title: 'Nuova prenotazione demo', message: `${cName} ha prenotato ${sName} per il ${when} presso ${lName}.`, type: 'booking_created', delivery_status: 'demo_simulated', appointment_id: appt.id }));
  } else {
    pushNotification(db, { user_id: appt.client_id, title: 'Prenotazione cancellata', message: `${sName} del ${when} è stato annullato.`, type: 'booking_cancelled', delivery_status: 'demo_simulated', appointment_id: appt.id });
    admins.forEach((a) => pushNotification(db, { user_id: a.id, title: 'Prenotazione cancellata', message: `${cName} ha annullato ${sName} del ${when}.`, type: 'booking_cancelled', delivery_status: 'demo_simulated', appointment_id: appt.id }));
  }
}

// ---- Query builder ----------------------------------------------------------
type Filter = { type: 'eq' | 'in' | 'gte' | 'lte'; col: string; val: any };

class LocalQuery implements PromiseLike<{ data: any; error: any }> {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: Filter[] = [];
  private payload: Row | Row[] | null = null;
  private selectStr = '*';
  private wantSelect = false;
  private singleRow = false;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;

  constructor(private table: string) {}

  select(str = '*') {
    if (this.op === 'select') this.selectStr = str;
    else this.wantSelect = true;
    return this;
  }
  insert(payload: Row | Row[]) { this.op = 'insert'; this.payload = payload; return this; }
  update(payload: Row) { this.op = 'update'; this.payload = payload; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(col: string, val: any) { this.filters.push({ type: 'eq', col, val }); return this; }
  in(col: string, val: any[]) { this.filters.push({ type: 'in', col, val }); return this; }
  gte(col: string, val: any) { this.filters.push({ type: 'gte', col, val }); return this; }
  lte(col: string, val: any) { this.filters.push({ type: 'lte', col, val }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderCol = col; this.orderAsc = opts?.ascending !== false; return this; }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.singleRow = true; return this; }
  maybeSingle() { this.singleRow = true; return this; }

  private match(row: Row) {
    return this.filters.every((f) => {
      const v = row[f.col];
      if (f.type === 'eq') return v === f.val;
      if (f.type === 'in') return f.val.includes(v);
      if (f.type === 'gte') return v >= f.val;
      if (f.type === 'lte') return v <= f.val;
      return true;
    });
  }

  private hydrate(db: Db, rows: Row[]) {
    if (!this.selectStr.includes('service:services')) return rows;
    return rows.map((a) => ({
      ...a,
      service: db.services.find((s) => s.id === a.service_id) ?? null,
      staff: db.staff_members.find((s) => s.id === a.staff_id) ?? null,
      client: db.profiles.find((p) => p.id === a.client_id) ?? null,
      location: db.locations?.find((l) => l.id === a.location_id) ?? null,
    }));
  }

  private run(): { data: any; error: any } {
    const db = loadDb();
    const list = db[this.table] ?? (db[this.table] = []);

    // INSERT
    if (this.op === 'insert') {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload!];
      const inserted: Row[] = [];
      for (const it of items) {
        // anti-overlap per appuntamenti confermati (come exclusion constraint)
        if (this.table === 'appointments' && (it.status ?? 'confirmed') === 'confirmed') {
          const clash = list.some(
            (r) => r.staff_id === it.staff_id && ['pending', 'confirmed'].includes(r.status) &&
              new Date(it.starts_at) < new Date(r.ends_at) && new Date(it.ends_at) > new Date(r.starts_at)
          );
          if (clash) return { data: null, error: { code: '23P01', message: 'Slot già occupato' } };
        }
        const row: Row = { id: it.id ?? uid(), created_at: nowIso(), updated_at: nowIso(), ...it };
        list.push(row);
        inserted.push(row);
        if (this.table === 'appointments') notifyOnAppointment(db, row, 'insert');
      }
      saveDb(db);
      const data = this.singleRow ? inserted[0] : inserted;
      return { data: this.wantSelect || this.singleRow ? data : null, error: null };
    }

    // UPDATE
    if (this.op === 'update') {
      const updated: Row[] = [];
      list.forEach((row, i) => {
        if (this.match(row)) {
          const before = row.status;
          const next: Row = { ...row, ...(this.payload as Row), updated_at: nowIso() };
          list[i] = next;
          updated.push(next);
          if (this.table === 'appointments' && next.status === 'cancelled' && before !== 'cancelled') {
            notifyOnAppointment(db, next, 'cancel');
          }
        }
      });
      saveDb(db);
      const data = this.singleRow ? updated[0] ?? null : updated;
      return { data: this.wantSelect || this.singleRow ? data : null, error: null };
    }

    // DELETE (con FK restrict simulato su servizi/staff con appuntamenti)
    if (this.op === 'delete') {
      const target = list.filter((r) => this.match(r));
      if (this.table === 'services' && target.some((s) => db.appointments.some((a) => a.service_id === s.id)))
        return { data: null, error: { code: '23503', message: 'FK restrict' } };
      if (this.table === 'staff_members' && target.some((s) => db.appointments.some((a) => a.staff_id === s.id)))
        return { data: null, error: { code: '23503', message: 'FK restrict' } };
      db[this.table] = list.filter((r) => !this.match(r));
      saveDb(db);
      return { data: null, error: null };
    }

    // SELECT
    let rows = list.filter((r) => this.match(r));
    if (this.orderCol) {
      const col = this.orderCol;
      rows = [...rows].sort((a, b) => {
        const av = a[col], bv = b[col];
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (this.orderAsc ? 1 : -1);
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);
    rows = this.hydrate(db, rows);
    if (this.singleRow) {
      return rows.length ? { data: rows[0], error: null } : { data: null, error: { message: 'No rows' } };
    }
    return { data: rows, error: null };
  }

  then<R1 = { data: any; error: any }, R2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    try {
      return Promise.resolve(this.run()).then(onfulfilled, onrejected);
    } catch (e) {
      return Promise.resolve({ data: null, error: e }).then(onfulfilled, onrejected);
    }
  }
}

// ---- Auth -------------------------------------------------------------------
type AuthCb = (event: string, session: any) => void;
const authCbs: AuthCb[] = [];

function getStoredSession(): any {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}
function setStoredSession(session: any) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  authCbs.forEach((cb) => cb(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
}
function sessionFor(userId: string, email: string) {
  return { access_token: 'demo', token_type: 'bearer', user: { id: userId, email } };
}

const localAuth = {
  async getSession() {
    return { data: { session: getStoredSession() }, error: null };
  },
  onAuthStateChange(cb: AuthCb) {
    authCbs.push(cb);
    return { data: { subscription: { unsubscribe() { const i = authCbs.indexOf(cb); if (i >= 0) authCbs.splice(i, 1); } } } };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const users = loadUsers();
    const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase() && x.password === password);
    if (!u) return { data: { session: null }, error: { message: 'Invalid login credentials' } };
    const session = sessionFor(u.id, u.email);
    setStoredSession(session);
    return { data: { session }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Row } }) {
    const users = loadUsers();
    if (users.some((x) => x.email.toLowerCase() === email.toLowerCase()))
      return { data: { session: null }, error: { message: 'User already registered' } };
    const id = uid();
    users.push({ id, email, password });
    saveUsers(users);
    const db = loadDb();
    db.profiles.push({ id, full_name: options?.data?.full_name ?? '', email, phone: options?.data?.phone ?? null, role: 'client', created_at: nowIso(), updated_at: nowIso() });
    saveDb(db);
    const session = sessionFor(id, email);
    setStoredSession(session);
    return { data: { session }, error: null };
  },
  async signOut() {
    setStoredSession(null);
    return { error: null };
  },
  async resetPasswordForEmail() {
    return { data: {}, error: null };
  },
};

// ---- Client -----------------------------------------------------------------
export const localClient = {
  from(table: string) {
    return new LocalQuery(table);
  },
  auth: localAuth,
  channel(_name: string) {
    const pending: { table: string; userId: string | null }[] = [];
    const chan = {
      on(_event: string, opts: { filter?: string; table?: string }, cb: (p: { new: Row }) => void) {
        const table = opts.table ?? 'notifications';
        const userId = opts.filter?.startsWith('user_id=eq.') ? opts.filter.split('user_id=eq.')[1] : null;
        pending.push({ table, userId });
        subs.push({ table, userId, cb });
        return chan;
      },
      subscribe() { return chan; },
    };
    return chan;
  },
  removeChannel() {
    return Promise.resolve('ok');
  },
};

export type LocalClient = typeof localClient;
