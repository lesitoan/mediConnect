import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { INDEX_PATH, KNOWLEDGE_PATH } from "../../configs/paths.js";
import { EmbeddingService } from "./embedding.service.js";

const DOCUMENT_SCHEMA = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});
const INDEX_SCHEMA = z.object({
  fingerprint: z.string(),
  documents: z.array(
    DOCUMENT_SCHEMA.extend({ vector: z.array(z.number().finite()).min(1) }),
  ),
});
type KnowledgeIndex = z.infer<typeof INDEX_SCHEMA>;

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || !left.length) return 0;
  let dot = 0,
    leftNorm = 0,
    rightNorm = 0;
  for (let index = 0; index < left.length; index++) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }
  return leftNorm && rightNorm ? dot / Math.sqrt(leftNorm * rightNorm) : 0;
}

@Injectable()
export class RetrievalService {
  private indexPromise?: Promise<KnowledgeIndex>;

  constructor(
    @Inject(EmbeddingService) private readonly embedding: EmbeddingService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  async buildIndex(force = false): Promise<KnowledgeIndex> {
    const raw = await readFile(KNOWLEDGE_PATH, "utf8");
    const fingerprint = createHash("sha256")
      .update(`${this.embedding.model}:q8:mean:normalized:v1:${raw}`)
      .digest("hex");
    if (!force) {
      try {
        const saved = INDEX_SCHEMA.parse(
          JSON.parse(await readFile(INDEX_PATH, "utf8")),
        );
        if (saved.fingerprint === fingerprint) return saved;
      } catch {
        /* Missing or stale indices are rebuilt from the local knowledge source. */
      }
    }
    const source = z.array(DOCUMENT_SCHEMA).parse(JSON.parse(raw));
    const documents: KnowledgeIndex["documents"] = [];
    for (const document of source)
      documents.push({
        ...document,
        vector: await this.embedding.embed(
          `${document.title}\n${document.content}`,
        ),
      });
    const result = { fingerprint, documents };
    await mkdir(dirname(INDEX_PATH), { recursive: true });
    const temporaryPath = `${INDEX_PATH}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(result));
    await rename(temporaryPath, INDEX_PATH);
    return result;
  }

  async search(query: string) {
    this.indexPromise ??= this.buildIndex().catch((error: unknown) => {
      this.indexPromise = undefined;
      throw error;
    });
    const index = await this.indexPromise;
    const queryVector = await this.embedding.embed(query);
    const threshold = Number(this.config.get<string>("RAG_MIN_SCORE") ?? "0.3");
    return index.documents
      .map(({ vector, ...document }) => ({
        ...document,
        score: cosineSimilarity(queryVector, vector),
      }))
      .filter((item) => item.score >= threshold)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
  }
}
