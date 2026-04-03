import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  // Note: We'll rely on the client-side useAuth for now, 
  // but in a production app, we'd check server-side session here.
  
  return <DashboardClient />;
}
