import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateVehicleDto, PaymentWebhookDto, UpdateVehicleDto } from './vehicles.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller()
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post('vehicles') create(@Body() input: CreateVehicleDto) { return this.service.create(input); }
  @Get('vehicles') list(@Query('status') status?: string) { return this.service.list(status); }
  @Get('vehicles/:id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Patch('vehicles/:id') update(@Param('id') id: string, @Body() input: UpdateVehicleDto) { return this.service.update(id, input); }

  @Post('vehicles/:id/sale') reserve(
    @Param('id') id: string,
    @Headers('x-internal-token') token: string | undefined,
    @Body() input: { buyerCpf: string; soldAt?: string }
  ) {
    if (token !== (process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-internal')) throw new UnauthorizedException('Token interno invalido');
    return this.service.reserveForSale(id, input.buyerCpf, input.soldAt ? new Date(input.soldAt) : new Date());
  }

  @Post('vehicles/:id/release') release(@Param('id') id: string, @Headers('x-internal-token') token: string | undefined) {
    if (token !== (process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-internal')) throw new UnauthorizedException('Token interno invalido');
    return this.service.releaseReservation(id);
  }

  @Post('webhooks/payments') paymentWebhook(
    @Headers('x-webhook-token') token: string | undefined,
    @Body() input: PaymentWebhookDto
  ) {
    if (token !== (process.env.WEBHOOK_TOKEN ?? 'change-me')) throw new UnauthorizedException('Webhook token invalido');
    return this.service.applyPayment(input);
  }
}