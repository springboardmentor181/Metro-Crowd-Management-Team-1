"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Chatbot } from "./Chatbot";
import type { Session } from "@/lib/session";

export function Shell({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-[color:var(--color-plane)]">
      {/* desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar role={session.role} />
      </div>

      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar role={session.role} onNavigate={() => setDrawer(false)} />
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-4 text-white/70"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} onMenu={() => setDrawer(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* AI assistant */}
      <Chatbot />
    </div>
  );
}
