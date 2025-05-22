'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminPanel from '../../components/AdminPanel';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { currentUser, isAuthLoading, isAdmin } = useAuth();
  const router = useRouter();

  // Überprüfe, ob der Benutzer eingeloggt und ein Admin ist
  React.useEffect(() => {
    if (!isAuthLoading && (!currentUser || !isAdmin)) {
      // Kein Admin-Zugriff, zur Startseite umleiten
      router.push('/');
    }
  }, [currentUser, isAuthLoading, isAdmin, router]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Lade...</p>
        </div>
      </div>
    );
  }

  // Wenn nicht eingeloggt oder kein Admin, wird umgeleitet, aber zur Sicherheit zeigen wir trotzdem nichts an
  if (!currentUser || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Admin-Bereich</h1>
      <AdminPanel />
    </div>
  );
}
