import { Routes, Route, useLocation } from 'react-router-dom';

import { PublicLayout } from '@/layouts/PublicLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminRoute } from '@/routes/AdminRoute';

import { Home } from '@/pages/Home';
import { Services } from '@/pages/Services';
import { Booking } from '@/pages/Booking';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { NotFound } from '@/pages/NotFound';
import { LegalPage } from '@/pages/Legal';

import { ClientDashboard } from '@/pages/client/Dashboard';
import { ClientAppointments } from '@/pages/client/Appointments';
import { ClientNotifications } from '@/pages/client/Notifications';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminCalendar } from '@/pages/admin/AdminCalendar';
import { AdminServices } from '@/pages/admin/AdminServices';
import { AdminStaff } from '@/pages/admin/AdminStaff';
import { AdminClients } from '@/pages/admin/AdminClients';
import { AdminSettings } from '@/pages/admin/AdminSettings';

export function AppRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="surface-enter">
      <Routes>
        {/* Autenticazione (senza layout pubblico) */}
        <Route path="/login" element={<Login />} />
        <Route path="/registrati" element={<Register />} />

        {/* Sito pubblico */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/servizi" element={<Services />} />
          <Route path="/prenota" element={<Booking />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/cookie" element={<LegalPage type="cookie" />} />
          <Route path="/termini" element={<LegalPage type="terms" />} />
        </Route>

        {/* Area cliente (protetta) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/dashboard/appuntamenti" element={<ClientAppointments />} />
            <Route path="/dashboard/notifiche" element={<ClientNotifications />} />
          </Route>
        </Route>

        {/* Area admin (solo admin) */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/calendario" element={<AdminCalendar />} />
            <Route path="/admin/notifiche" element={<ClientNotifications />} />
            <Route path="/admin/servizi" element={<AdminServices />} />
            <Route path="/admin/staff" element={<AdminStaff />} />
            <Route path="/admin/clienti" element={<AdminClients />} />
            <Route path="/admin/impostazioni" element={<AdminSettings />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
