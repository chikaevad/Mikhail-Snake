'use client';

import { authClient } from '@/auth/client';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const registerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
    setError,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    const { name, email: _email, password } = data;
    const email = _email.trim().toLowerCase();

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error !== null) {
      setError('root', { type: 'manual', message: error.message });
      return;
    }

    router.replace('/');
  }

  const nameValue = watch('name');
  const emailValue = watch('email');
  const passwordValue = watch('password');

  const buttonDisabled =
    isSubmitting || isSubmitSuccessful || !nameValue || !emailValue || !passwordValue;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-gray-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder="John Doe"
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.name && <div>{errors.name.message}</div>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-gray-700">
            Email address
          </label>
          <input
            id="email"
            type="text"
            {...register('email')}
            placeholder="m@example.com"
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.email && <div>{errors.email.message}</div>}
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="********"
            className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          {errors.password && <div>{errors.password.message}</div>}
          {errors.root && <div>{errors.root.message}</div>}
        </div>

        <button
          type="submit"
          disabled={buttonDisabled}
          className="w-full rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700"
        >
          {isSubmitting || isSubmitSuccessful ? 'Loading...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        Already got an account ?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </>
  );
}
