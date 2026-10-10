import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { UserSessionsService } from './user-sessions.service';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [UsersRepository, UsersService, UserSessionsService],
  exports: [UsersService, UserSessionsService],
})
export class UsersModule {}
