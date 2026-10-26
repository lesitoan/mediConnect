"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronRight, Download, Home, Lock, ShieldCheck, Check } from "@/components/layout/icons";
import { useAuth } from "@/features/auth/useAuth";
import { PROFILE, type IdentityForm } from "../data";
import { ContactsSection, IdentitySection, MedicalSection, SecuritySection } from "./ProfileSections";
import ProfileSidebar, { NAV } from "./ProfileSidebar";

export default function ProfilePage() {
  const { user, ready } = useAuth();

  const [saved, setSaved] = useState<IdentityForm>(PROFILE.identity);
  const [form, setForm] = useState<IdentityForm>(PROFILE.identity);
  const [active, setActive] = useState<string>(NAV[0].id);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = JSON.stringify(form) !== JSON.stringify(saved);
  const emailOk = form.email.trim() === "" || /^\S+@\S+\.\S+$/.test(form.email.trim());
  const valid = emailOk && form.dob !== "" && form.address.trim() !== "";

  const onChange: <K extends keyof IdentityForm>(k: K, v: IdentityForm[K]) => void = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setMsg(null);
  };

  const goto = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const flash = (ok: boolean, text: string) => {
    setMsg({ ok, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 4000);
  };

  const save = async () => {
    if (!dirty || saving) return;
    if (!valid) {
      flash(false, "Vui lòng kiểm tra lại email, ngày sinh và địa chỉ.");
      return;
    }
    setSaving(true);
    try {
      // TODO: gọi API cập nhật hồ sơ bệnh nhân. Backend kiểm tra dữ liệu, ghi Audit Log
      // các trường thay đổi (SRS UC01); không cho sửa họ tên/CCCD đã xác thực.
      await new Promise((r) => setTimeout(r, 700));
      setSaved(form);
      flash(true, "Cập nhật thông tin thành công.");
    } catch {
      flash(false, "Không thể lưu lúc này. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  if (!user) {
    return (
      <section className="bg-[#F6FAFE] py-20">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <h1 className="text-xl font-extrabold text-slate-900">Vui lòng đăng nhập</h1>
          <p className="mt-3 text-sm text-slate-600">Bạn cần đăng nhập để xem hồ sơ cá nhân.</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-[#0A5A84] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Đăng nhập
          </Link>
        </div>
      </section>
    );
  }

  const saveBtn = (cls: string, label: string) => (
    <button
      type="button"
      onClick={save}
      disabled={!dirty || saving}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A5A84] px-6 py-3 text-xs font-bold text-white shadow transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300 ${cls}`}
    >
      {saving ? "Đang lưu..." : label}
    </button>
  );

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-5 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="flex items-center gap-1 hover:text-[#0A5A84]">
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#0A5A84]">Thông tin cá nhân &amp; Hồ sơ y tế</li>
          </ol>
        </nav>

        {/* Tiêu đề */}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
              Hồ Sơ &amp; Thông Tin Cá Nhân
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
              <span>
                Mã số bệnh án (PID):{" "}
                <b className="rounded bg-blue-100 px-1.5 py-0.5 text-[#0A5A84]">{user.pid}</b>
              </span>
              <span>
                Cập nhật gần nhất: <b className="text-slate-700">{PROFILE.updatedAt}</b>
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0A5A84]">
                <Lock className="h-3 w-3" />
                Bảo mật cấp độ 4
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              // TODO: xuất hồ sơ (PDF) của chính bệnh nhân
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-[#0A5A84] shadow-sm transition hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Xuất dữ liệu hồ sơ (PDF)
            </button>
            {saveBtn("", "Lưu thay đổi")}
          </div>
        </div>

        {msg && (
          <p
            role="status"
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}
          >
            {msg.ok ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {msg.text}
          </p>
        )}

        {/* Nội dung */}
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-32">
            <ProfileSidebar
              name={PROFILE.fullName.replace(/\b\w/g, (c) => c.toUpperCase()).toLowerCase() && user.fullName}
              pid={user.pid}
              dob={form.dob}
              gender={form.gender}
              active={active}
              onNav={goto}
            />
          </aside>

          <div className="space-y-6">
            <IdentitySection form={form} onChange={onChange} />
            <MedicalSection />
            <ContactsSection />
            <SecuritySection />

            {/* Thanh lưu */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
              <p className="flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="h-3.5 w-3.5 text-[#2B6CB0]" />
                Dữ liệu y tế được mã hóa End-to-End SSL 256-bit theo chuẩn Quốc Tế.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={!dirty || saving}
                  onClick={() => {
                    setForm(saved);
                    setMsg(null);
                  }}
                  className="rounded-xl bg-blue-50 px-6 py-3 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                {saveBtn("", "Lưu thay đổi hồ sơ")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}