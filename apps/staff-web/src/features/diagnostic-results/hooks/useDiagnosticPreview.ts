"use client";
import { useEffect, useSyncExternalStore } from "react";
import { useGetAuthUserQuery } from "@/features/auth/services/authApi";
import type { Examination } from "@/features/examinations/types/examinationTypes";
import {
  getDiagnosticPreview,
  getDiagnosticPreviewOwner,
  setDiagnosticPreviewOwner,
  getServerDiagnosticPreview,
  registerDiagnosticOrders,
  subscribeDiagnosticPreview,
} from "../services/diagnosticPreviewStore";
export function useDiagnosticPreview() {
  const { data: user } = useGetAuthUserQuery();
  const orders = useSyncExternalStore(
    subscribeDiagnosticPreview,
    getDiagnosticPreview,
    getServerDiagnosticPreview,
  );
  useEffect(() => {
    setDiagnosticPreviewOwner(user?.id);
  }, [user?.id]);
  return user?.id === getDiagnosticPreviewOwner()
    ? orders
    : getServerDiagnosticPreview();
}
export function useRegisterDiagnosticExamination(item: Examination) {
  const {
    id,
    careSessionId,
    patientName,
    patientCode,
    demographics,
    room,
    labOrders,
    labReason,
    labNotes,
    status,
    isLocked,
  } = item;
  useEffect(() => {
    registerDiagnosticOrders({
      id,
      careSessionId,
      patientName,
      patientCode,
      demographics,
      room,
      labOrders,
      labReason,
      labNotes,
      status,
      isLocked,
    });
  }, [
    id,
    careSessionId,
    patientName,
    patientCode,
    demographics,
    room,
    labOrders,
    labReason,
    labNotes,
    status,
    isLocked,
  ]);
}
