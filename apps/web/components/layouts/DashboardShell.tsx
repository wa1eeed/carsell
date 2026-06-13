'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function DashboardShell({ showroomName, showroomSlug, children }: { showroomName: string; showroomSlug?: string | null; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-screen bg-cl-gray-50">
      {/* Desktop sidebar — fixed height, scrolls internally */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Right side — topbar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar showroomName={showroomName} showroomSlug={showroomSlug} onMenuClick={() => setOpen(true)} />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
