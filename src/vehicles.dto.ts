import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString() @Length(2, 80) brand!: string;
  @ApiProperty({ example: 'Corolla XEi' })
  @IsString() @Length(1, 80) model!: string;
  @ApiProperty({ example: 2023 })
  @Type(() => Number) @IsInt() @Min(1886) year!: number;
  @ApiProperty({ example: 'Prata' })
  @IsString() @Length(2, 40) color!: string;
  @ApiProperty({ example: 125900.50 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price!: number;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Toyota' })
  @IsOptional() @IsString() @Length(2, 80) brand?: string;
  @ApiPropertyOptional({ example: 'Corolla Altis' })
  @IsOptional() @IsString() @Length(1, 80) model?: string;
  @ApiPropertyOptional({ example: 2024 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1886) year?: number;
  @ApiPropertyOptional({ example: 'Branco' })
  @IsOptional() @IsString() @Length(2, 40) color?: string;
  @ApiPropertyOptional({ example: 129900 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price?: number;
}

export enum PaymentStatus { PAID = 'PAID', CANCELLED = 'CANCELLED' }

export class PaymentWebhookDto {
  @ApiProperty({ example: 'PAYMENT-CODE-RETURNED-BY-SALE' })
  @IsString() paymentCode!: string;
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PAID })
  @IsEnum(PaymentStatus) status!: PaymentStatus;
  @ApiPropertyOptional({ example: '2026-09-03T20:00:00.000Z' })
  @IsOptional() @IsDateString() paidAt?: string;
  @ApiPropertyOptional({ example: 'webhook-event-001' })
  @IsOptional() @IsString() idempotencyKey?: string;
}

export class ReserveVehicleDto {
  @ApiProperty({ example: '12345678901' })
  @IsString() buyerCpf!: string;
  @ApiPropertyOptional({ example: '2026-09-03T20:00:00.000Z' })
  @IsOptional() @IsDateString() soldAt?: string;
}