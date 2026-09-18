"use client";

import { useRef, useState } from "react";
import { formatNaira } from "@/lib/utils/currency";
import { Download, FileText, X } from "lucide-react";

const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";

interface Transaction {
  id: string;
  provider: string;
  provider_transaction_reference: string;
  amount: number;
  status: string;
  payer_name: string | null;
  transaction_date: string;
}

export function TransactionReceiptModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState<"image" | "pdf" | null>(null);

  const date = new Date(transaction.transaction_date);
  const dateStr = date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  async function captureCanvas() {
    const html2canvas = (await import("html2canvas")).default;
    if (!receiptRef.current) return null;
    return html2canvas(receiptRef.current, { backgroundColor: "#ffffff", scale: 2 });
  }

  async function downloadImage() {
    setGenerating("image");
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `royal-fragrance-receipt-${transaction.provider_transaction_reference}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setGenerating(null);
    }
  }

  async function downloadPdf() {
    setGenerating("pdf");
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      // Size the PDF page to match the receipt's own aspect ratio rather
      // than forcing it onto a fixed A4/letter page, since a receipt is
      // narrow and tall, not a full document page.
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`royal-fragrance-receipt-${transaction.provider_transaction_reference}.pdf`);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl2 bg-white">
        <div className="flex items-center justify-between border-b border-espresso/10 p-4">
          <p className="font-display text-espresso">Receipt</p>
          <button onClick={onClose} aria-label="Close">
            <X size={20} className="text-rich/50" />
          </button>
        </div>

        {/* This exact block is what gets captured as the image/PDF —
            self-contained styling (no external classes that could fail to
            render inside html2canvas's own rendering pass). */}
        <div ref={receiptRef} className="bg-white p-6" style={{ fontFamily: "sans-serif" }}>
          <div className="mb-4 flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="Royal Fragrance" style={{ height: 48, width: 48 }} />
            <p style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: "#1E120C" }}>
              Royal Fragrance
            </p>
            <p style={{ fontSize: 11, color: "#70452F" }}>Payment Receipt</p>
          </div>

          <div
            style={{
              borderTop: "1px dashed #ccc",
              borderBottom: "1px dashed #ccc",
              padding: "12px 0",
              margin: "12px 0",
            }}
          >
            <Row label="Reference" value={transaction.provider_transaction_reference} />
            <Row label="Date" value={dateStr} />
            <Row label="Time" value={timeStr} />
            <Row label="From" value={transaction.payer_name ?? "Not provided"} />
            <Row label="Status" value={transaction.status} />
          </div>

          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ fontSize: 11, color: "#70452F" }}>Amount</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: "#1E120C" }}>
              {formatNaira(transaction.amount)}
            </p>
          </div>

          <p style={{ marginTop: 16, textAlign: "center", fontSize: 10, color: "#999" }}>
            royalfragrancegallery.com
          </p>
        </div>

        <div className="flex gap-2 border-t border-espresso/10 p-4">
          <button
            onClick={downloadImage}
            disabled={generating !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso/20 px-4 py-2.5 text-sm text-espresso hover:bg-espresso/5 disabled:opacity-50"
          >
            <Download size={16} /> {generating === "image" ? "Saving…" : "Image"}
          </button>
          <button
            onClick={downloadPdf}
            disabled={generating !== null}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich disabled:opacity-50"
          >
            <FileText size={16} /> {generating === "pdf" ? "Saving…" : "PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
      <span style={{ color: "#70452F" }}>{label}</span>
      <span style={{ color: "#1E120C", fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>
        {value}
      </span>
    </div>
  );
}
