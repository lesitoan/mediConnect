"use client";

import { useAuth } from "@/features/auth/useAuth";
import AuthedExperts from "./AuthedExperts";
import AuthedHero from "./AuthedHero";
import AuthedSpecialties from "./AuthedSpecialties";

export default function HomeSwitch({ guest }: { guest: React.ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) return <div className="min-h-[70vh]" aria-hidden="true" />;
  if (!user) return <>{guest}</>;

  return (
    <>
      <AuthedHero />
      <AuthedSpecialties />
      <AuthedExperts />
    </>
  );
}