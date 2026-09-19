"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAuthed } from "@/lib/api";

export default function PdfThumb({ url, name }: { url: string; name?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        // Files are auth-protected, so fetch with the token and load directly.
        const blob = await fetchAuthed(url);
        const buf = new Uint8Array(await blob.arrayBuffer());
        if (cancelled) return;
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        if (cancelled) return;
        setPages(doc.numPages);
        const page = await doc.getPage(1);
        const vp = page.getViewport({ scale: 1 });
        const scale = (220 / vp.width) * (window.devicePixelRatio || 1);
        const out = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = out.width;
        canvas.height = out.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: out } as any).promise;
        if (!cancelled) setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-white">
      <canvas ref={canvasRef} className={`block h-full w-full object-contain ${state === "ok" ? "" : "hidden"}`} />
      {state === "loading" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-slate-400">
          <span className="text-xl leading-none">📕</span>
          <span>{name || "pdf"}</span>
        </div>
      )}
      {state === "error" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-slate-400">
          <span className="text-xl leading-none">📕</span>
          <span className="max-w-[130px] truncate">{name || "pdf"}</span>
        </div>
      )}
      {state === "ok" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4 text-[10px] font-medium text-white">
          {pages} {pages === 1 ? "page" : "pages"}
        </div>
      )}
    </div>
  );
}