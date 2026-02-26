"use client";

import { ReactNode } from "react";

interface LayoutShellProps {
  sidebar: ReactNode;
  main: ReactNode;
  rightPanel?: ReactNode;
}

export default function LayoutShell({ sidebar, main, rightPanel }: LayoutShellProps) {
  return (
    <div 
      className="mx-auto max-w-[1400px]"
      style={{ minHeight: 'calc(100vh - 64px)' }}
    >
      <div 
        className="grid gap-0"
        style={{ gridTemplateColumns: '240px 1fr 300px' }}
      >
        {/* Left Sidebar */}
        <aside 
          className="hidden lg:block border-r border-[var(--color-fog)]"
          style={{
            padding: '24px 16px',
            background: 'var(--color-cloud)',
            minHeight: '600px'
          }}
        >
          <div className="sticky top-20 space-y-4">{sidebar}</div>
        </aside>

        {/* Main Content */}
        <main 
          className="min-w-0"
          style={{
            padding: '24px 28px',
            background: 'var(--color-paper)'
          }}
        >
          {main}
        </main>

        {/* Right Panel */}
        {rightPanel && (
          <aside 
            className="hidden lg:block border-l border-[var(--color-fog)]"
            style={{
              padding: '24px 20px',
              background: 'var(--color-cloud)'
            }}
          >
            <div className="sticky top-20 space-y-4">{rightPanel}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
