"use client";

import { Download, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ExportButton({
  filename,
  rows,
  label = "Export",
  className,
}: {
  filename: string;
  rows: Record<string, unknown>[];
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <button
      onClick={download}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] px-3 py-1.5 text-sm font-medium hover:bg-[color:var(--color-surface-2)]",
        className
      )}
    >
      {done ? <Check size={15} className="text-[color:var(--color-crowd-low)]" /> : <Download size={15} />}
      {done ? "Downloaded" : label}
    </button>
  );
}
