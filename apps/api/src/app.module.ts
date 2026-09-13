import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    HealthModule,
    PrismaModule,
    DisciplinesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
