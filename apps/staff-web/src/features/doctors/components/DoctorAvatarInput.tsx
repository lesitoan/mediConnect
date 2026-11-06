"use client";

import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/button";
import type { useDoctorAvatar } from "../hooks/useDoctorAvatar";

export function DoctorAvatarInput({
  id,
  avatar,
  disabled,
}: {
  id: string;
  avatar: ReturnType<typeof useDoctorAvatar>;
  disabled: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label
        htmlFor={id}
        className="block text-label font-semibold text-foreground"
      >
        Ảnh đại diện bác sĩ
      </label>
      {avatar.previewUrl && (
        <Image
          unoptimized
          src={avatar.previewUrl}
          alt="Ảnh đại diện bác sĩ"
          width={64}
          height={64}
          className="size-16 rounded-full object-cover"
        />
      )}
      <Input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        onChange={(event) => {
          avatar.selectFile(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
      />
      <p className="break-all text-caption text-muted">
        {avatar.fileName}. JPG, PNG hoặc WebP, tối đa 2 MB.
      </p>
      {avatar.error && (
        <p role="alert" className="text-caption text-error">
          {avatar.error}
        </p>
      )}
      {(avatar.hasSelectedFile || avatar.error) && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          disabled={disabled}
          onClick={avatar.clearFile}
        >
          Bỏ ảnh mới
        </Button>
      )}
    </div>
  );
}
