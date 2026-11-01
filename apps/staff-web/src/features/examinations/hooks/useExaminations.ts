"use client";
import { useState } from "react";
import { createDemoExaminations } from "../constants";
import { applyExaminationChanges } from "../examinationUtils";
import type { Examination } from "../types/examinationTypes";
export function useExaminations() {
  const [items, setItems] = useState(() => {
    const records = createDemoExaminations("2026-03-16");
    return [
      ...records,
      ...[
        {
          id: "QUEUE-CURRENT",
          patientName: "Vũ Hải Đăng",
          patientCode: "BN-12601",
          demographics: "Nam · 40 tuổi",
          queueNumber: "STT A-021",
        },
        {
          id: "QUEUE-CALLING",
          patientName: "Hoàng Mai Linh",
          patientCode: "BN-11480",
          demographics: "Nữ · 28 tuổi",
          queueNumber: "STT A-022",
        },
        {
          id: "QUEUE-RESULTS",
          patientName: "Nguyễn Bích Ngọc",
          patientCode: "BN-12562",
          demographics: "Nữ · 35 tuổi",
          queueNumber: "STT A-020",
          status: "WAITING_RESULTS" as const,
        },
        {
          id: "QUEUE-WAITING",
          patientName: "Phạm Văn Tuấn",
          patientCode: "BN-10923",
          demographics: "Nam · 30 tuổi",
          queueNumber: "STT A-027",
        },
        {
          id: "QUEUE-SKIPPED",
          patientName: "Dương Quốc Bảo",
          patientCode: "BN-10683",
          demographics: "Nam · 45 tuổi",
          queueNumber: "STT A-016",
        },
      ].map((item) => ({ ...records[0], ...item, isQueueOnly: true })),
    ];
  });
  const update = (id: string, changes: Partial<Examination>) =>
    setItems((previous) =>
      previous.map((item) => {
        return item.id === id ? applyExaminationChanges(item, changes) : item;
      }),
    );
  return { items, update };
}
