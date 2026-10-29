import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { env, pipeline } from "@huggingface/transformers";
import { resolve, sep } from "node:path";
import { AI_ROOT } from "../../configs/paths.js";

@Injectable()
export class EmbeddingService {
  private extractorPromise?: Promise<(text: string) => Promise<number[]>>;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {}

  get model(): string {
    return (
      this.config.get<string>("EMBEDDING_MODEL") ??
      "Xenova/paraphrase-multilingual-MiniLM-L12-v2"
    );
  }

  embed(text: string): Promise<number[]> {
    this.extractorPromise ??= this.load().catch((error: unknown) => {
      this.extractorPromise = undefined;
      throw error;
    });
    return this.extractorPromise.then((extract) => extract(text));
  }

  private async load() {
    env.cacheDir = resolve(AI_ROOT, "models");
    env.localModelPath = resolve(AI_ROOT, "models") + sep;
    env.allowRemoteModels =
      this.config.get<string>("ALLOW_MODEL_DOWNLOAD") !== "false";
    const extractor = await pipeline("feature-extraction", this.model, {
      dtype: "q8",
    });
    return async (text: string): Promise<number[]> => {
      const output = await extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      return Array.from(output.data, Number);
    };
  }
}
