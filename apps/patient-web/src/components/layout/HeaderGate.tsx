"use client";

import { useAuth } from "@/features/auth/useAuth";
import AuthedHeader from "./AuthedHeader";
import Header from "./Header";

export default function HeaderGate() {
  const { user, ready } = useAuth();

  if (!ready) return <div className="h-[108px]" aria-hidden="true" />;
  return user ? <AuthedHeader user={user} /> : <Header />;
}