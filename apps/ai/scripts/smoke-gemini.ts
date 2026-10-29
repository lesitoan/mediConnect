import "reflect-metadata";
import { config } from "dotenv";
import { ConfigService } from "@nestjs/config";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { AI_ROOT } from "../src/configs/paths.js";
import { GeminiService } from "../src/modules/llm/gemini.service.js";
import { IntentRouterService } from "../src/modules/chats/intent-router.service.js";
import { ChatsService } from "../src/modules/chats/chats.service.js";
import { EmbeddingService } from "../src/modules/knowledge/embedding.service.js";
import { RetrievalService } from "../src/modules/knowledge/retrieval.service.js";
import { MediconnectApiService } from "../src/modules/lookups/mediconnect-api.service.js";

config({ path: resolve(AI_ROOT, ".env"), quiet: true });
const settings = new ConfigService();
const llm = new GeminiService(settings);
const router = new IntentRouterService(llm);
for (const [message, expected] of [
  ["Hôm nay khoa Nhi trống lịch lúc mấy giờ?", "SEARCH_AVAILABLE_SLOTS"],
  ["Khoa Tim mạch có các bác sĩ nào?", "LIST_DOCTORS"],
  ["Đặt giúp tôi lịch khám ngày mai", "UNSUPPORTED"],
]) {
  const result = await router.route({ message, history: [] });
  assert.equal(result.intent, expected);
  console.log(JSON.stringify({ message, result }));
}
const followup = await router.route({
  message: "Thế ngày mai?",
  history: [
    { role: "user", text: "Hôm nay khoa Nhi còn giờ nào?" },
    { role: "assistant", text: "Không có khung giờ còn trống hôm nay." },
  ],
});
assert.equal(followup.intent, "SEARCH_AVAILABLE_SLOTS");
assert.match(followup.specialtyName ?? "", /nhi/i);
assert.ok(followup.dateFrom);
console.log(JSON.stringify({ followup }));
const retrieval = new RetrievalService(
  new EmbeddingService(settings),
  settings,
);
const chat = new ChatsService(
  router,
  retrieval,
  new MediconnectApiService(settings),
  llm,
);
const rag = await chat.chat({
  message: "Đi khám cần chuẩn bị những gì?",
  history: [],
});
assert.equal(rag.intent, "SEARCH_KNOWLEDGE");
assert.ok(rag.sources.some((source) => source.id === "visit-preparation"));
console.log(JSON.stringify({ rag }));
