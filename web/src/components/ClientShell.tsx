'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { AuthProvider } from '../lib/authContext';

const ShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // A página de login é exibida em tela cheia sem Header ou Sidebar
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <main className="min-h-screen bg-slate-900">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Header 
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} 
        isMobileMenuOpen={mobileMenuOpen} 
      />
      <div className="flex flex-1 relative min-w-0">
        <Sidebar 
          mobileOpen={mobileMenuOpen} 
          onCloseMobile={() => setMobileMenuOpen(false)} 
        />
        <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-[1600px] mx-auto w-full min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export const ClientShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  );
};
