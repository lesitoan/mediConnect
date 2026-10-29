import { Module } from "@nestjs/common";
import { EmbeddingService } from "./embedding.service.js";
import { KnowledgeWarmupService } from "./knowledge-warmup.service.js";
import { RetrievalService } from "./retrieval.service.js";

@Module({
  providers: [EmbeddingService, RetrievalService, KnowledgeWarmupService],
  exports: [RetrievalService],
})
export class KnowledgeModule {}
