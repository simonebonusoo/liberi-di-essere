import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div key={location.pathname} className="route-page-enter">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
