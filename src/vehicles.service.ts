import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma.service';
import { CreateVehicleDto, PaymentWebhookDto, PaymentStatus, UpdateVehicleDto } from './vehicles.dto';

@Injectable()
export class VehiclesService {
  private readonly salesUrl = process.env.SALES_SERVICE_URL ?? 'http://localhost:3002';
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: { id: randomUUID(), ...input, paymentCode: randomUUID() } });
  }

  list(status?: string) {
    return this.prisma.vehicle.findMany({ where: status ? { status } : undefined, orderBy: { price: 'asc' } });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Veiculo nao encontrado');
    return vehicle;
  }

  async update(id: string, input: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: input });
  }

  async reserveForSale(id: string, buyerCpf: string, soldAt: Date) {
    const result = await this.prisma.vehicle.updateMany({ where: { id, status: 'FOR_SALE' }, data: { status: 'RESERVED', buyerCpf, soldAt, paymentStatus: 'PENDING' } });
    if (result.count === 0) throw new ConflictException('Veiculo nao esta disponivel');
    return this.findOne(id);
  }

  async releaseReservation(id: string) {
    const result = await this.prisma.vehicle.updateMany({ where: { id, status: 'RESERVED' }, data: { status: 'FOR_SALE', buyerCpf: null, soldAt: null, paymentStatus: 'CANCELLED' } });
    if (result.count === 0) throw new ConflictException('Reserva nao encontrada');
    return this.findOne(id);
  }

  async applyPayment(input: PaymentWebhookDto) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { paymentCode: input.paymentCode } });
    if (!vehicle) throw new NotFoundException('Codigo de pagamento nao encontrado');
    if (vehicle.status === 'SOLD' && input.status === PaymentStatus.CANCELLED) throw new ConflictException('Venda ja confirmada');
    const updated = vehicle.paymentStatus === input.status ? vehicle : await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { paymentStatus: input.status, status: input.status === PaymentStatus.PAID ? 'SOLD' : 'FOR_SALE', soldAt: input.status === PaymentStatus.PAID ? (input.paidAt ? new Date(input.paidAt) : new Date()) : null }
    });
    try {
      const syncResponse = await fetch(`${this.salesUrl}/sales/payment`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-internal' }, body: JSON.stringify({ paymentCode: input.paymentCode, status: input.status }) });
      if (!syncResponse.ok) throw new Error('sales service rejected payment sync');
    } catch {
      throw new InternalServerErrorException('Nao foi possivel sincronizar o pagamento');
    }
    return updated;
  }
}