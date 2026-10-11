"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { applyAsVendor } from "@/lib/actions/vendor-application";
import { trackMetaEvent } from "@/components/analytics/MetaPixel";
import {
  APPLICATION_TITLE,
  APPLICATION_INTRO,
  MAIN_QUESTIONS,
  REFERENCE_HEADING,
  REFERENCE_DESCRIPTION,
  REFERENCE_QUESTIONS,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUS_OPTIONS,
  STUDENT_FOLLOWUPS,
  type QuestionDef,
} from "@/lib/vendor-application-fields";

const inputClass =
  "w-full rounded-lg border border-espresso/15 px-4 py-2.5 text-sm focus:border-caramel focus:outline-none";

export function VendorApplicationForm({
  initialEmail,
  whatsappLink,
}: {
  initialEmail?: string;
  whatsappLink?: string;
} = {}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [studentStatus, setStudentStatus] = useState("");
  const [studentOther, setStudentOther] = useState("");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const setAnswer = (key: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!bvn.trim() && !nin.trim()) {
      setError("BVN or NIN is compulsory. Please provide at least one.");
      return;
    }
    if (bvn.trim() && !/^\d{11}$/.test(bvn.trim())) {
      setError("BVN must be exactly 11 digits.");
      return;
    }
    if (nin.trim() && !/^\d{11}$/.test(nin.trim())) {
      setError("NIN must be exactly 11 digits.");
      return;
    }
    if (!studentStatus) {
      setError("Please choose an option for STUDENT OR NOT.");
      return;
    }

    setStatus("loading");
    const result = await applyAsVendor({
      email,
      password,
      bvn: bvn.trim(),
      nin: nin.trim(),
      studentStatus,
      studentOther,
      answers,
    });

    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    trackMetaEvent("Lead", { content_name: "Vendor Application" });
  }

  if (status === "success") {
    return (
      <div className="rounded-xl2 border border-espresso/10 bg-white/60 p-8 text-center shadow-premium-sm">
        <h3 className="font-display text-xl text-espresso">Application Submitted</h3>
        <p className="mt-2 text-sm text-rich/70">
          We&rsquo;ll review your application and notify you once approved. Your
          dashboard stays locked until then.
        </p>
        {whatsappLink && (
          <>
            <p className="mt-5 text-sm text-espresso">
              Just finished the form? Message the Royal Fragrance team on
              WhatsApp to let us know, or to ask any question.
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm text-white hover:bg-green-700"
            >
              <MessageCircle size={18} />
              Message us on WhatsApp
            </a>
          </>
        )}
        <button
          onClick={() => router.push("/login")}
          className="mt-4 block w-full text-sm text-rich/60 underline"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl2 border border-espresso/10 bg-white/60 p-6 shadow-premium-sm sm:p-8"
    >
      <h2 className="font-display text-xl tracking-wide text-espresso">{APPLICATION_TITLE}</h2>
      {APPLICATION_INTRO.map((line) => (
        <p key={line} className="text-sm text-rich/70">
          {line}
        </p>
      ))}

      <div>
        <Label text="Email" required />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className={inputClass}
        />
      </div>

      <div>
        <Label text="Create a password for your vendor account" required />
        <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {MAIN_QUESTIONS.map((q) => (
        <QuestionField key={q.key} q={q} value={answers[q.key] ?? ""} onChange={(v) => setAnswer(q.key, v)} />
      ))}

      <div className="border-t border-espresso/10 pt-4">
        <h3 className="font-display text-base text-espresso">{REFERENCE_HEADING}</h3>
        <p className="mt-1 text-xs text-rich/60">{REFERENCE_DESCRIPTION}</p>
      </div>
      {REFERENCE_QUESTIONS.map((q) => (
        <QuestionField key={q.key} q={q} value={answers[q.key] ?? ""} onChange={(v) => setAnswer(q.key, v)} />
      ))}

      <div className="border-t border-espresso/10 pt-4">
        <Label text={STUDENT_STATUS_LABEL} required />
        <div className="space-y-2">
          {STUDENT_STATUS_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-rich/80">
              <input
                type="radio"
                name="studentStatus"
                checked={studentStatus === opt}
                onChange={() => setStudentStatus(opt)}
              />
              {opt === "Other" ? "Other:" : opt}
              {opt === "Other" && studentStatus === "Other" && (
                <input
                  required
                  value={studentOther}
                  onChange={(e) => setStudentOther(e.target.value)}
                  className="ml-1 flex-1 rounded-lg border border-espresso/15 px-3 py-1.5 text-sm focus:border-caramel focus:outline-none"
                />
              )}
            </label>
          ))}
        </div>
      </div>
      {STUDENT_FOLLOWUPS.map((q) => (
        <QuestionField key={q.key} q={q} value={answers[q.key] ?? ""} onChange={(v) => setAnswer(q.key, v)} />
      ))}

      <div className="border-t border-espresso/10 pt-4">
        <Label text="BVN or NIN" required />
        <p className="mb-2 text-xs text-rich/60">
          Compulsory. Provide your 11-digit BVN or NIN (at least one). It is used
          to open your personal collection account for customer payments.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={bvn}
            onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
            placeholder="BVN"
            inputMode="numeric"
            maxLength={11}
            className={inputClass}
          />
          <input
            value={nin}
            onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
            placeholder="NIN"
            inputMode="numeric"
            maxLength={11}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Submitting…" : "Submit Application"}
      </Button>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full border border-espresso/20 px-4 py-2.5 text-sm text-espresso hover:bg-espresso/5"
        >
          <MessageCircle size={16} />
          Have questions? Chat with our brand on WhatsApp
        </a>
      )}
    </form>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-espresso">
      {text}
      {required && <span className="text-red-600"> *</span>}
    </label>
  );
}

function QuestionField({
  q,
  value,
  onChange,
}: {
  q: QuestionDef;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label text={q.label} required={q.required} />
      <input
        type={q.type ?? "text"}
        required={q.required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer"
        className={inputClass}
      />
    </div>
  );
}
