import {
  INITIAL_QUEUE_ITEMS,
  QUEUE_ERROR_MESSAGES,
  QUEUE_STATUSES,
  QUEUE_STORAGE_KEY,
  QUEUE_TRANSITIONS,
} from "../constants";
import type {
  QueueActionInput,
  QueueItem,
  QueueStatus,
} from "../types/queueTypes";

export function applyQueueAction(
  items: QueueItem[],
  input: QueueActionInput,
): QueueItem[] {
  const item = items.find((item) => item.id === input.id);
  if (!item) throw new Error(QUEUE_ERROR_MESSAGES.NOT_FOUND);

  const transition = QUEUE_TRANSITIONS[input.action];
  if (item.status !== input.expectedStatus || item.status !== transition.from) {
    throw new Error(QUEUE_ERROR_MESSAGES.STATUS_CHANGED);
  }

  return items.map((item) =>
    item.id === input.id ? { ...item, status: transition.to } : item,
  );
}

// Persist only demo status overrides in this tab until the queue API is available.
export function getQueueItems(): QueueItem[] {
  const items = structuredClone(INITIAL_QUEUE_ITEMS);
  if (typeof window === "undefined") return items;

  const stored = window.sessionStorage.getItem(QUEUE_STORAGE_KEY);
  if (!stored) return items;

  let statuses: unknown;
  try {
    statuses = JSON.parse(stored);
  } catch {
    return items;
  }
  if (!statuses || typeof statuses !== "object" || Array.isArray(statuses))
    return items;

  return items.map((item) => {
    const status = (statuses as Record<string, unknown>)[item.id];
    return typeof status === "string" &&
      QUEUE_STATUSES.includes(status as QueueStatus)
      ? { ...item, status: status as QueueStatus }
      : item;
  });
}

export function updateQueueItem(input: QueueActionInput): QueueItem {
  const items = applyQueueAction(getQueueItems(), input);
  if (typeof window === "undefined")
    throw new Error(QUEUE_ERROR_MESSAGES.BROWSER_REQUIRED);

  try {
    window.sessionStorage.setItem(
      QUEUE_STORAGE_KEY,
      JSON.stringify(
        Object.fromEntries(items.map((item) => [item.id, item.status])),
      ),
    );
  } catch {
    throw new Error(QUEUE_ERROR_MESSAGES.STORAGE_FAILED);
  }
  return items.find((item) => item.id === input.id)!;
}
