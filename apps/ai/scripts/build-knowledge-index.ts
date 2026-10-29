import "reflect-metadata";
import { config } from "dotenv";
import { ConfigService } from "@nestjs/config";
import { resolve } from "node:path";
import { AI_ROOT } from "../src/configs/paths.js";
import { EmbeddingService } from "../src/modules/knowledge/embedding.service.js";
import { RetrievalService } from "../src/modules/knowledge/retrieval.service.js";

config({ path: resolve(AI_ROOT, ".env"), quiet: true });
const settings = new ConfigService();
const retrieval = new RetrievalService(
  new EmbeddingService(settings),
  settings,
);
const index = await retrieval.buildIndex(true);
console.log(`Indexed ${index.documents.length} knowledge documents.`);
