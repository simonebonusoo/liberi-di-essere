import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { salonConfig } from '@/config/salonConfig';

const schema = z.object({
  email: z.string().email('Inserisci un\'email valida'),
  password: z.string().min(6, 'Minimo 6 caratteri'),
});
type FormData = z.infer<typeof schema>;

const demoCredentials = {
  admin: { email: 'admin@demo.it', password: 'admin1234', target: '/admin' },
  client: { email: 'cliente@demo.it', password: 'demo1234', target: '/dashboard' },
};

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const clientTarget = from.startsWith('/admin') ? '/dashboard' : from;

  const {
    register,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: demoCredentials.client.email,
      password: demoCredentials.client.password,
    },
  });

  const onSubmit = async (data: FormData, target: string) => {
    try {
      await signIn(data.email, data.password);
      toast.success('Bentornato!');
      navigate(target, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Accesso non riuscito');
    }
  };

  const loginWithDemoRole = async (role: keyof typeof demoCredentials) => {
    const credentials = demoCredentials[role];
    setValue('email', credentials.email);
    setValue('password', credentials.password);
    await onSubmit(credentials, role === 'client' ? clientTarget : credentials.target);
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
          <form className="space-y-4">
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
            <div className="grid gap-2">
              <Button
                type="button"
                fullWidth
                loading={isSubmitting}
                onClick={() => void loginWithDemoRole('admin')}
              >
                Accedi come admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                loading={isSubmitting}
                onClick={() => void loginWithDemoRole('client')}
              >
                Accedi come cliente
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
