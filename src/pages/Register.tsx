import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { salonConfig } from '@/config/salonConfig';

const schema = z
  .object({
    fullName: z.string().min(2, 'Inserisci il tuo nome completo'),
    email: z.string().email('Email non valida'),
    phone: z
      .string()
      .min(6, 'Numero non valido')
      .regex(/^[+\d\s().-]+$/, 'Numero non valido')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Minimo 6 caratteri'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Le password non coincidono',
    path: ['confirm'],
  });
type FormData = z.infer<typeof schema>;

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const { needsEmailConfirm } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
      });
      if (needsEmailConfirm) {
        toast.success('Registrazione completata! Controlla l\'email per confermare.');
        navigate('/login', { state: { from } });
      } else {
        toast.success('Benvenuto in ' + salonConfig.name + '!');
        navigate(from, { replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Registrazione non riuscita');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="heading-serif text-2xl text-brand-900">
            {salonConfig.logoText}
          </Link>
          <p className="mt-1 text-sm text-brand-500">Crea il tuo account cliente</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nome e cognome"
              placeholder="Mario Rossi"
              autoComplete="name"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="tua@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Telefono (opzionale)"
              placeholder="+39 333 1234567"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Minimo 6 caratteri"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Conferma password"
              type="password"
              autoComplete="new-password"
              error={errors.confirm?.message}
              {...register('confirm')}
            />
            <Button type="submit" fullWidth loading={isSubmitting}>
              Registrati
            </Button>
          </form>
        </Card>
        <p className="mt-6 text-center text-sm text-brand-500">
          Hai già un account?{' '}
          <Link to="/login" state={{ from }} className="font-semibold text-brand-800 hover:underline">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
