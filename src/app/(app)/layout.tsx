import { getValidSession } from '@/auth/utils';

export default async function Layout({ children }: { children: React.ReactNode }) {
  await getValidSession();

  return <>{children}</>;
}
