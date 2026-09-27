import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { PlansModule } from './modules/plans/plans.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { ClassSessionsModule } from './modules/class-sessions/class-sessions.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CheckInModule } from './modules/check-in/check-in.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RecurringClassesModule } from './modules/recurring-classes/recurring-classes.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    HealthModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    GymsModule,
    DisciplinesModule,
    PlansModule,
    MembershipsModule,
    ClassSessionsModule,
    BookingsModule,
    CheckInModule,
    DashboardModule,
    RecurringClassesModule,
  ],
  controllers: [],
  providers: [
    // Orden importa: JwtAuthGuard corre primero y llena request.user;
    // RolesGuard corre después y puede asumir que ya existe (o no, ver @Public).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
