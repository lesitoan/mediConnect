import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  readonly schemaName: string;

  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>('database.url');
    const schema =
      new URL(connectionString).searchParams.get('schema') || 'public';
    super({
      adapter: new PrismaPg(
        { connectionString, connectionTimeoutMillis: 5000 },
        { schema },
      ),
    });
    this.schemaName = schema;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
    this.logger.log('PostgreSQL connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
