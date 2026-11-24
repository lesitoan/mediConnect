"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  Check,
} from "@/components/layout/icons";
import { clearSession, useAuth } from "@/features/auth/useAuth";
import PatientBreadcrumb from "@/components/layout/PatientBreadcrumb";
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

  return (
    <section className="bg-gradient-to-b from-[#EAF3FD] to-[#F6FAFE] pb-14">
      <PatientBreadcrumb currentPage="profile" />
      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-16">

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
        <div className="mt-6 grid items-stretch gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-7">
          <aside className="h-full">
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
                isDirty={isDirty}
                isIdentityValid={isIdentityValid}
                isSaving={isSaving}
                onEdit={() => setIsEditing(true)}
                onSave={save}
                onCancel={() => {
                  setForm(saved);
                  setIsEditing(false);
                  setMsg(null);
                }}
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

          </div>
        </div>
      </div>
    </section>
  );
}
