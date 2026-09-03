import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateVehicleDto {
  @IsString() @Length(2, 80) brand!: string;
  @IsString() @Length(1, 80) model!: string;
  @Type(() => Number) @IsInt() @Min(1886) year!: number;
  @IsString() @Length(2, 40) color!: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price!: number;
}

export class UpdateVehicleDto {
  @IsOptional() @IsString() @Length(2, 80) brand?: string;
  @IsOptional() @IsString() @Length(1, 80) model?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1886) year?: number;
  @IsOptional() @IsString() @Length(2, 40) color?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) price?: number;
}

export enum PaymentStatus { PAID = 'PAID', CANCELLED = 'CANCELLED' }

export class PaymentWebhookDto {
  @IsString() paymentCode!: string;
  @IsEnum(PaymentStatus) status!: PaymentStatus;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsString() idempotencyKey?: string;
}