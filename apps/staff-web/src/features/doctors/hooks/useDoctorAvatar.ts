"use client";

import { useEffect, useRef, useState } from "react";
import { useUploadDoctorAvatarMutation } from "../services/doctorsApi";
import { MAX_DOCTOR_AVATAR_BYTES } from "../types/doctorTypes";

export function useDoctorAvatar(initialUrl = "") {
  const [uploadDoctorAvatar] = useUploadDoctorAvatarMutation();
  const [selection, setSelection] = useState<{
    file: File | null;
    previewUrl: string;
  }>({
    file: null,
    previewUrl: initialUrl,
  });
  const [error, setError] = useState<string | null>(null);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  useEffect(
    () => () => {
      if (selection.previewUrl.startsWith("blob:"))
        URL.revokeObjectURL(selection.previewUrl);
    },
    [selection.previewUrl],
  );
  return {
    previewUrl: selection.previewUrl,
    fileName: selection.file?.name ?? "Chưa chọn ảnh mới",
    hasSelectedFile: !!selection.file,
    error,
    clearFile() {
      setError(null);
      setSelection({ file: null, previewUrl: initialUrl });
    },
    selectFile(file: File | null) {
      if (!file) return;
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > MAX_DOCTOR_AVATAR_BYTES ||
        !file.size
      ) {
        setError("Chọn ảnh JPG, PNG hoặc WebP, dung lượng tối đa 2 MB.");
        return;
      }
      setError(null);
      setSelection({ file, previewUrl: URL.createObjectURL(file) });
    },
    async save(): Promise<string | null> {
      const file = selection.file;
      if (!file) return initialUrl || null;
      if (uploaded.current?.file === file) return uploaded.current.url;
      const url = await uploadDoctorAvatar(file).unwrap();
      uploaded.current = { file, url };
      return url;
    },
  };
}
