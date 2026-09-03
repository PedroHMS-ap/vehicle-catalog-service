import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { PrismaService } from './prisma.service';
import { VehiclesService } from './vehicles.service';
import { HealthController } from './health.controller';

@Module({ controllers: [VehiclesController, HealthController], providers: [PrismaService, VehiclesService] })
export class AppModule {}