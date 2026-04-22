import { getMaybeSession } from '@/auth/utils';
import { redirect } from 'next/navigation';

import RegisterForm from './register-form';

export default async function LoginPage() {
  const session = await getMaybeSession();

  if (session !== null) {
    redirect('/');
  }

  return (
    <div className="flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Register</h1>
        <p className="text-gray-500">Register a new account</p>
        <RegisterForm />
      </div>
    </div>
  );
}
