import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { salonConfig } from '@/config/salonConfig';

const schema = z.object({
  email: z.string().email('Inserisci un\'email valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
});
type FormData = z.infer<typeof schema>;

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await signIn(data.email, data.password);
      toast.success('Bentornato!');
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Accesso non riuscito');
    }
  };

  const demoLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      toast.success('Accesso demo effettuato');
      navigate(email.startsWith('cliente') ? '/dashboard' : '/admin', { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Accesso demo non riuscito');
    }
  };

  const handleReset = async () => {
    const email = getValues('email');
    if (!email) return toast.error('Inserisci prima la tua email');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) toast.error(error.message);
    else toast.success('Ti abbiamo inviato le istruzioni via email.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="heading-serif text-2xl text-brand-900">
            {salonConfig.logoText}
          </Link>
          <p className="mt-1 text-sm text-brand-500">Accedi alla tua area riservata</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tua@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-brand-500 hover:text-brand-700"
            >
              Password dimenticata?
            </button>
            <Button type="submit" fullWidth loading={isSubmitting}>
              Accedi
            </Button>
          </form>
          {!isSupabaseConfigured && (
            <div className="mt-5 space-y-2 border-t border-brand-100 pt-5">
              <p className="text-center text-xs text-brand-500">
                Pulsanti disponibili solo in ambiente demo locale.
              </p>
              <Button variant="outline" fullWidth onClick={() => demoLogin('superadmin@demo.it', 'super1234')}>
                Accedi come super admin demo
              </Button>
              <Button variant="outline" fullWidth onClick={() => demoLogin('admin@demo.it', 'admin1234')}>
                Accedi come amministratore demo
              </Button>
              <Button variant="ghost" fullWidth onClick={() => demoLogin('cliente@demo.it', 'demo1234')}>
                Accedi come cliente demo
              </Button>
            </div>
          )}
        </Card>
        <p className="mt-6 text-center text-sm text-brand-500">
          Non hai un account?{' '}
          <Link to="/registrati" state={{ from }} className="font-semibold text-brand-800 hover:underline">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
