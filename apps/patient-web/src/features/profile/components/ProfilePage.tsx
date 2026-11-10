"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  Home,
  Lock,
  ShieldCheck,
  Check,
} from "@/components/layout/icons";
import { clearSession, useAuth } from "@/features/auth/useAuth";
import { formatProfileDate, type IdentityForm } from "../data";
import {
  getPatientMedicalRecords,
  getPatientProfile,
  type PatientMedicalRecord,
  type PatientProfile,
  updatePatientProfile,
} from "../services/patientProfileService";
import { AllergySection, IdentitySection, SecuritySection } from "./ProfileSections";
import ProfileSidebar, { NAV } from "./ProfileSidebar";

const EMPTY_FORM: IdentityForm = {
  nationalId: "",
  dateOfBirth: "",
  gender: "",
  address: "",
};

function toIdentityForm(profile: PatientProfile): IdentityForm {
  return {
    nationalId: profile.nationalId ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    address: profile.address ?? "",
  };
}

export default function ProfilePage() {
  const { user, ready } = useAuth();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [records, setRecords] = useState<PatientMedicalRecord[]>([]);
  const [saved, setSaved] = useState<IdentityForm>(EMPTY_FORM);
  const [form, setForm] = useState<IdentityForm>(EMPTY_FORM);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadState, setLoadState] = useState<{
    key: string;
    status: "READY" | "ERROR";
    error?: string;
  } | null>(null);
  const [active, setActive] = useState<string>(NAV[0].id);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ isSuccess: boolean; text: string } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestKey = user ? `${JSON.stringify(user)}:${reloadKey}` : "";

  useEffect(() => {
    if (!ready || !user) return;

    const controller = new AbortController();
    Promise.all([
      getPatientProfile(controller.signal),
      getPatientMedicalRecords(controller.signal),
    ])
      .then(([patientProfile, medicalRecords]) => {
        const identityForm = toIdentityForm(patientProfile);
        setProfile(patientProfile);
        setRecords(medicalRecords);
        setSaved(identityForm);
        setForm(identityForm);
        setLoadState({ key: requestKey, status: "READY" });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setLoadState({
            key: requestKey,
            status: "ERROR",
            error:
              error instanceof Error
                ? error.message
                : "Không thể tải hồ sơ sức khỏe.",
          });
        }
      });

    return () => controller.abort();
  }, [ready, user, reloadKey, requestKey]);

  const isLoading =
    ready && !!user && (!loadState || loadState.key !== requestKey);
  const loadError =
    loadState?.key === requestKey && loadState.status === "ERROR"
      ? (loadState.error ?? "Không thể tải hồ sơ sức khỏe.")
      : "";

  const isDirty = JSON.stringify(form) !== JSON.stringify(saved);
  const isIdentityValid =
    form.nationalId.length === 0 || /^\d{12}$/.test(form.nationalId);

  const onChange: <K extends keyof IdentityForm>(
    k: K,
    v: IdentityForm[K],
  ) => void = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setMsg(null);
  };

  const goto = (id: string) => {
    setActive(id);
  };

  const logout = () => {
    clearSession();
    window.location.assign("/login");
  };

  const flash = (isSuccess: boolean, text: string) => {
    setMsg({ isSuccess, text });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 4000);
  };

  const save = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const updatedProfile = await updatePatientProfile(form);
      const identityForm = toIdentityForm(updatedProfile);
      setProfile(updatedProfile);
      setSaved(identityForm);
      setForm(identityForm);
      setIsEditing(false);
      flash(true, "Cập nhật thông tin thành công.");
    } catch (error: unknown) {
      flash(
        false,
        error instanceof Error
          ? error.message
          : "Không thể lưu lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;

  if (!user) {
    return (
      <section className="bg-[#F6FAFE] py-20">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <h1 className="text-xl font-extrabold text-slate-900">
            Vui lòng đăng nhập
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Bạn cần đăng nhập để xem hồ sơ cá nhân.
          </p>
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

  if (isLoading) {
    return (
      <section className="bg-[#F6FAFE] py-20">
        <p className="text-center text-sm text-slate-600" role="status">
          Đang tải hồ sơ sức khỏe...
        </p>
      </section>
    );
  }

  if (loadError || !profile) {
    return (
      <section className="bg-[#F6FAFE] py-20">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-10 text-center shadow-[0_6px_24px_rgba(10,90,132,0.08)]">
          <h1 className="text-xl font-extrabold text-slate-900">
            Không thể tải hồ sơ
          </h1>
          <p className="mt-3 text-sm text-red-600" role="alert">
            {loadError || "Tài khoản chưa có hồ sơ bệnh nhân được liên kết."}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-6 rounded-full bg-[#0A5A84] px-7 py-3 text-xs font-bold text-white transition hover:bg-[#08486B]"
          >
            Thử tải lại
          </button>
        </div>
      </section>
    );
  }

  const saveBtn = (cls: string, label: string) => (
    <button
      type="button"
      onClick={save}
      disabled={!isDirty || !isIdentityValid || isSaving}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A5A84] px-6 py-3 text-xs font-bold text-white shadow transition hover:bg-[#08486B] disabled:cursor-not-allowed disabled:bg-slate-300 ${cls}`}
    >
      {isSaving ? "Đang lưu..." : label}
    </button>
  );

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
      <div className="mx-auto max-w-7xl px-4">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-5 text-xs text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link
                href="/"
                className="flex items-center gap-1 hover:text-[#0A5A84]"
              >
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" />
            <li className="font-bold text-[#0A5A84]">
              Thông tin cá nhân &amp; Hồ sơ y tế
            </li>
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
                <b className="rounded bg-blue-100 px-1.5 py-0.5 text-[#0A5A84]">
                  {profile.patientCode}
                </b>
              </span>
              <span>
                Cập nhật gần nhất:{" "}
                <b className="text-slate-700">
                  {formatProfileDate(profile.updatedAt)}
                </b>
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0A5A84]">
                <Lock className="h-3 w-3" />
                Hồ sơ cá nhân
              </span>
            </p>
          </div>
        </div>

        {msg && (
          <p
            role="status"
            className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold ${
              msg.isSuccess
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {msg.isSuccess ? (
              <Check className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {msg.text}
          </p>
        )}

        {/* Nội dung */}
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7">
          <aside>
            <ProfileSidebar
              profile={profile}
              dateOfBirth={form.dateOfBirth}
              gender={form.gender}
              active={active}
              onNav={goto}
              onLogout={logout}
            />
          </aside>

          <div className="min-w-0 space-y-4">
            {active === "identity" && (
              <IdentitySection
                profile={profile}
                form={form}
                isEditing={isEditing}
                onEdit={() => setIsEditing(true)}
                onChange={onChange}
              />
            )}
            {active === "allergies" && (
              <AllergySection
                records={records}
                onCreated={() => setReloadKey((key) => key + 1)}
              />
            )}
            {active === "security" && <SecuritySection />}

            {active === "identity" && (isEditing || isDirty) && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-[0_8px_28px_rgba(10,90,132,0.08)]">
                <p className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-[#2B6CB0]" />
                  Thông tin được cập nhật an toàn theo tài khoản đang đăng nhập.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={!isDirty || isSaving}
                    onClick={() => {
                      setForm(saved);
                      setIsEditing(false);
                      setMsg(null);
                    }}
                    className="rounded-xl bg-blue-50 px-6 py-3 text-xs font-bold text-[#0A5A84] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  {saveBtn("", "Lưu thay đổi hồ sơ")}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
