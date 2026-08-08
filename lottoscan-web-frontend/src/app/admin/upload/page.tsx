"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks";
import { lottery as lotteryApi } from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { LOTTERIES } from "@/lib/constants";

export default function UploadPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    draw_date: new Date().toISOString().slice(0, 10),
    lottery_name: "",
    draw_number: "",
    first_prize: "5000000",
    second_prize: "250000",
    third_prize: "50000",
    fourth_prize: "10000",
  });

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/admin");
  }, [loading, isAdmin, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === "application/pdf") {
      setFile(f);
      setError("");
    } else setError("Only PDF files are accepted");
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file");
      return;
    }
    if (!form.draw_date) {
      setError("Draw date is required");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const fd = new FormData();
      fd.append("pdf", file);
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      const res = await lotteryApi.uploadResults(fd);
      setSuccess(`Uploaded successfully: ${res.data.data?.lottery_name || "Lottery results"}`);
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAdmin) return null;

  return (
    <div className="bg-brand-bg min-h-screen pt-24 pb-16">
      <div className="container max-w-2xl">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/dashboard"
            className="text-text-secondary hover:text-text-primary transition-colors font-body text-sm font-bold border border-border-default px-3 py-1.5 rounded-lg bg-white shadow-sm"
          >
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-text-primary leading-tight">
              Upload Results
            </h1>
            <p className="text-text-secondary font-body text-xs font-semibold mt-0.5">
              Manually upload lottery PDF draw results
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* File Upload Drop Zone */}
          <Card>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-[20px] p-10 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-gold bg-gold-light/20 shadow-inner"
                  : file
                  ? "border-win bg-win-light/40"
                  : "border-border-default hover:border-border-hover bg-white hover:shadow-sm"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setError("");
                  }
                }}
                className="hidden"
              />
              <div className="space-y-3">
                <div className="text-5xl select-none">{file ? "📄" : "☁️"}</div>
                {file ? (
                  <div className="space-y-1">
                    <p className="text-win font-body font-bold text-base leading-snug truncate max-w-sm mx-auto">
                      {file.name}
                    </p>
                    <p className="text-text-secondary font-mono text-xs">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-text-primary font-body font-bold text-sm">
                      Drop results PDF here or click to browse
                    </p>
                    <p className="text-text-muted text-xs font-body">
                      Accepts official draw sheets · Max 10MB PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Details Form Card */}
          <Card className="bg-white border border-border-default shadow-sm p-6">
            <h3 className="text-text-primary font-display font-extrabold text-base mb-5 border-b border-border-default/50 pb-3">
              Draw Specifications
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-2 block">
                    Draw Date *
                  </label>
                  <input
                    type="date"
                    value={form.draw_date}
                    onChange={(e) => setForm((p) => ({ ...p, draw_date: e.target.value }))}
                    className="input-dark text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-2 block">
                    Draw Number
                  </label>
                  <input
                    type="text"
                    value={form.draw_number}
                    onChange={(e) => setForm((p) => ({ ...p, draw_number: e.target.value }))}
                    placeholder="e.g. 1234"
                    className="input-dark text-sm w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-2 block">
                  Lottery Name
                </label>
                <select
                  value={form.lottery_name}
                  onChange={(e) => setForm((p) => ({ ...p, lottery_name: e.target.value }))}
                  className="input-dark text-sm w-full font-body"
                >
                  <option value="">Auto-detect from PDF text</option>
                  {LOTTERIES.map((l) => (
                    <option key={l.name} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-border-default/50 pt-5 mt-2">
                <h4 className="text-text-secondary text-xs font-body uppercase font-bold tracking-wider mb-3.5">
                  Prize Structure (Rs.)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {(["first_prize", "second_prize", "third_prize", "fourth_prize"] as const).map((field, i) => (
                    <div key={field}>
                      <label className="text-text-secondary text-xs font-body font-semibold mb-1.5 block capitalize">
                        {["1st", "2nd", "3rd", "4th"][i]} Prize
                      </label>
                      <input
                        type="number"
                        value={form[field]}
                        onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                        className="input-dark text-sm w-full font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Feedback Badges */}
          {error && (
            <div className="bg-lose-light border border-red-200 rounded-2xl p-4 animate-slide-up">
              <p className="text-lose text-sm font-body font-semibold text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-win-light border border-green-200 rounded-2xl p-4 animate-slide-up">
              <p className="text-win text-sm font-body font-semibold text-center">✅ {success}</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            loading={uploading}
            disabled={!file}
            fullWidth
            size="lg"
            className="shadow-sm"
          >
            {uploading ? "Uploading PDF..." : "Upload Results PDF →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
