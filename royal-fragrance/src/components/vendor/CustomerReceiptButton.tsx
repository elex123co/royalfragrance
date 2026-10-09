"use client";

import { useRef, useState } from "react";
import { Download, FileText, MessageCircle, Receipt, X } from "lucide-react";
import { formatNaira } from "@/lib/utils/currency";

const LOGO_URL =
  "https://res.cloudinary.com/dtchp470a/image/upload/v1788705368/WhatsApp_Image_2026-09-05_at_17.32.39__1_-removebg-preview_1_qaxnfw.png";

export interface ReceiptData {
  saleNumber: string;
  date: string; // ISO
  customerName: string | null;
  customerPhone: string | null;
  vendorName: string;
  vendorCode: string;
  paymentReference: string | null;
  amountPaid: number | null;
  items: { name: string; size: string | null; quantity: number; price: number }[];
}

/** wa.me needs international digits; convert local 0XXXXXXXXXX numbers. */
function waDigits(raw: string | null): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) return `234${d.slice(1)}`;
  return d;
}

export function CustomerReceiptButton({ data }: { data: ReceiptData }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"image" | "pdf" | "share" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const total = data.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const d = new Date(data.date);
  const dateStr = d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  const fileBase = `royal-fragrance-receipt-${data.saleNumber}`;

  async function capture() {
    const html2canvas = (await import("html2canvas")).default;
    if (!ref.current) return null;
    return html2canvas(ref.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
  }

  async function downloadImage() {
    setBusy("image");
    try {
      const canvas = await capture();
      if (!canvas) return;
      const a = document.createElement("a");
      a.download = `${fileBase}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    setBusy("pdf");
    try {
      const canvas = await capture();
      if (!canvas) return;
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${fileBase}.pdf`);
    } finally {
      setBusy(null);
    }
  }

  // On phones this opens the share sheet with the receipt image attached,
  // so the vendor picks WhatsApp and sends the picture. Where file sharing
  // is not supported, the image is saved and WhatsApp opens with a message
  // to the customer so the vendor can attach it.
  async function shareWhatsApp() {
    setBusy("share");
    try {
      const canvas = await capture();
      if (!canvas) return;
      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const file = new File([blob], `${fileBase}.png`, { type: "image/png" });
      const text = `Hello${data.customerName ? ` ${data.customerName}` : ""}, thank you for your purchase from Royal Fragrance. Your receipt ${data.saleNumber} for ${formatNaira(total)} is attached.`;

      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], text, title: "Royal Fragrance Receipt" });
          return;
        } catch {
          // user cancelled the share sheet
          return;
        }
      }

      const a = document.createElement("a");
      a.download = `${fileBase}.png`;
      a.href = URL.createObjectURL(blob);
      a.click();
      const digits = waDigits(data.customerPhone);
      window.open(
        `https://wa.me/${digits}?text=${encodeURIComponent(text + " (Please attach the downloaded receipt image.)")}`,
        "_blank"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-espresso/20 px-3 py-1.5 text-xs text-espresso hover:bg-espresso/5"
      >
        <Receipt size={14} /> Customer Receipt
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl2 bg-white">
            <div className="flex items-center justify-between border-b border-espresso/10 p-4">
              <p className="font-display text-espresso">Customer Receipt</p>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={20} className="text-rich/50" />
              </button>
            </div>

            {/* Captured as the image/PDF: inline styles only so html2canvas renders it faithfully. */}
            <div ref={ref} style={{ background: "#fff", padding: 24, fontFamily: "sans-serif" }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_URL} alt="Royal Fragrance" crossOrigin="anonymous" style={{ height: 48, width: 48, margin: "0 auto" }} />
                <p style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: "#1E120C" }}>Royal Fragrance</p>
                <p style={{ fontSize: 11, color: "#70452F" }}>Purchase Receipt</p>
              </div>

              <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "10px 0", margin: "10px 0" }}>
                <Row label="Receipt No." value={data.saleNumber} />
                <Row label="Date" value={`${dateStr}, ${timeStr}`} />
                {data.customerName && <Row label="Customer" value={data.customerName} />}
                <Row label="Served by" value={`${data.vendorName} (${data.vendorCode})`} />
                {data.paymentReference && <Row label="Payment Ref." value={data.paymentReference} />}
              </div>

              <div style={{ margin: "8px 0" }}>
                {data.items.map((it, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: "#1E120C" }}>
                    <span style={{ maxWidth: "65%" }}>
                      {it.name}
                      {it.size ? ` (${it.size})` : ""} x {it.quantity}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatNaira(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #1E120C", paddingTop: 8, marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#1E120C" }}>
                  <span>Total</span>
                  <span>{formatNaira(total)}</span>
                </div>
                {data.amountPaid !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#70452F", marginTop: 4 }}>
                    <span>Amount paid</span>
                    <span>{formatNaira(data.amountPaid)}</span>
                  </div>
                )}
              </div>

              <p style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#70452F" }}>
                Thank you for shopping with Royal Fragrance.
              </p>
              <p style={{ marginTop: 4, textAlign: "center", fontSize: 10, color: "#999" }}>royalfragrancegallery.com</p>
            </div>

            <div className="space-y-2 border-t border-espresso/10 p-4">
              <button
                onClick={shareWhatsApp}
                disabled={busy !== null}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                <MessageCircle size={16} /> {busy === "share" ? "Preparing…" : "Send to customer on WhatsApp"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={downloadImage}
                  disabled={busy !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-espresso/20 px-4 py-2.5 text-sm text-espresso hover:bg-espresso/5 disabled:opacity-50"
                >
                  <Download size={16} /> {busy === "image" ? "Saving…" : "Image"}
                </button>
                <button
                  onClick={downloadPdf}
                  disabled={busy !== null}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 py-2.5 text-sm text-cream hover:bg-rich disabled:opacity-50"
                >
                  <FileText size={16} /> {busy === "pdf" ? "Saving…" : "PDF"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}>
      <span style={{ color: "#70452F" }}>{label}</span>
      <span style={{ color: "#1E120C", fontWeight: 600, textAlign: "right", maxWidth: "62%" }}>{value}</span>
    </div>
  );
}
