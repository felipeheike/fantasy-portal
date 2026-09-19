'use client';

import { Wrench, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface MaintenanceScreenProps {
  message?: string | null;
}

export default function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-portal-bg flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="p-5 rounded-3xl bg-portal-surface border-2 border-portal-border">
        <Wrench className="w-10 h-10 text-primary animate-pulse" />
      </div>
      <div className="space-y-3 max-w-md">
        <h1 className="text-2xl font-black uppercase tracking-tight text-portal-text">Portal em Manutenção</h1>
        <p className="text-sm text-portal-text-muted font-body italic leading-relaxed">
          {message || 'Estamos ajustando algo por trás das cortinas. Volte em instantes.'}
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 px-5 py-2.5 bg-portal-surface border border-portal-border rounded-2xl text-portal-text-muted hover:text-primary hover:border-primary/50 transition-all font-black uppercase tracking-widest text-[10px]"
      >
        <LogOut className="w-3.5 h-3.5" /> Sair da Conta
      </button>
    </div>
  );
}
