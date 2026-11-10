import {
  Module,
  RequestMethod,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';
import { auditRequestContextMiddleware } from './audit-request-context.middleware';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminAuditLogsController],
  providers: [AuditLogsService],
  exports: [AuditLogsService],
})
export class AuditLogsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(auditRequestContextMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
