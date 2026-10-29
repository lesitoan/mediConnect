import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { RetrievalService } from "./retrieval.service.js";

@Injectable()
export class KnowledgeWarmupService implements OnApplicationBootstrap {
  constructor(private readonly retrieval: RetrievalService) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.retrieval.search("MediConnect");
  }
}
