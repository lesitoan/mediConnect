"use client";
import Image from "next/image";
import { useModal } from "@/hooks/useModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import type { DiagnosticImage } from "../types/diagnosticTypes";
export function DiagnosticImageGallery({
  images,
  onRemove,
  disabled = false,
}: {
  images: readonly DiagnosticImage[];
  onRemove?: (id: string) => void;
  disabled?: boolean;
}) {
  const preview = useModal<DiagnosticImage>();
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <div
            key={image.id}
            className="min-w-0 rounded-app-lg border border-border bg-surface p-2"
          >
            <button
              type="button"
              className="block w-full rounded-app-md focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={"Xem ảnh " + image.name}
              onClick={() => preview.open(image)}
            >
              <Image
                unoptimized
                src={image.url}
                width={240}
                height={160}
                alt={image.name}
                className="aspect-video w-full rounded-app-md bg-background object-contain"
              />
            </button>
            <p
              className="mt-2 truncate text-caption text-muted"
              title={image.name}
            >
              {image.name}
            </p>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={disabled}
                className="mt-1 text-error"
                aria-label={"Xóa ảnh " + image.name}
                onClick={() => onRemove(image.id)}
              >
                Bỏ ảnh
              </Button>
            )}
          </div>
        ))}
      </div>
      <Dialog
        open={preview.isOpen}
        onOpenChange={(open) => {
          if (!open) preview.close();
        }}
      >
        <DialogContent className="max-h-full max-w-5xl overflow-y-auto p-0">
          <DialogHeader>
            <DialogTitle>Ảnh kết quả</DialogTitle>
            <DialogDescription>{preview.data?.name}</DialogDescription>
          </DialogHeader>
          {preview.data && (
            <Image
              unoptimized
              src={preview.data.url}
              width={1200}
              height={900}
              alt={preview.data.name}
              className="h-auto w-full object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
