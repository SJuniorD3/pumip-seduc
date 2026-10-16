'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 mb-4">
      <ol className="flex items-center flex-wrap gap-1.5">
        <li className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 py-0.5"
            title="Página Inicial"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Início</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1 || item.isCurrent;

          return (
            <li key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              {isLast || !item.href ? (
                <span
                  className="font-semibold text-slate-800 max-w-xs sm:max-w-md truncate"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-slate-500 hover:text-blue-600 transition font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1 py-0.5 max-w-[200px] truncate"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
