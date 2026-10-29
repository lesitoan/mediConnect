import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export const AI_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const KNOWLEDGE_PATH = resolve(
  AI_ROOT,
  "src/modules/knowledge/data/knowledge.json",
);
export const INDEX_PATH = resolve(AI_ROOT, "storage/knowledge-index.json");
