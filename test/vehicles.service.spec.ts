import { ConflictException, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '../src/vehicles.dto';
import { VehiclesService } from '../src/vehicles.service';

function prismaMock() { return { vehicle: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() } }; }

describe('VehiclesService', () => {
  it('creates a vehicle with a payment code', async () => {
    const prisma = prismaMock(); prisma.vehicle.create.mockResolvedValue({ id: '1' });
    const result = await new VehiclesService(prisma as never).create({ brand: 'Ford', model: 'Ka', year: 2020, color: 'Preto', price: 50000 });
    expect(result).toEqual({ id: '1' }); expect(prisma.vehicle.create).toHaveBeenCalled();
  });
  it('lists by ascending price', async () => {
    const prisma = prismaMock(); prisma.vehicle.findMany.mockResolvedValue([]);
    await new VehiclesService(prisma as never).list('FOR_SALE');
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({ where: { status: 'FOR_SALE' }, orderBy: { price: 'asc' } });
  });
  it('lists all vehicles when no status is provided', async () => {
    const prisma = prismaMock(); prisma.vehicle.findMany.mockResolvedValue([]);
    await new VehiclesService(prisma as never).list();
    expect(prisma.vehicle.findMany).toHaveBeenCalledWith({ where: undefined, orderBy: { price: 'asc' } });
  });
  it('throws when vehicle is missing', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue(null);
    await expect(new VehiclesService(prisma as never).findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
  it('updates an existing vehicle', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue({ id: '1' }); prisma.vehicle.update.mockResolvedValue({ id: '1', color: 'Azul' });
    await expect(new VehiclesService(prisma as never).update('1', { color: 'Azul' })).resolves.toEqual({ id: '1', color: 'Azul' });
  });
  it('reserves only available vehicles', async () => {
    const prisma = prismaMock(); prisma.vehicle.updateMany.mockResolvedValue({ count: 0 });
    await expect(new VehiclesService(prisma as never).reserveForSale('1', '12345678901', new Date())).rejects.toBeInstanceOf(ConflictException);
  });
  it('reserves an available vehicle', async () => {
    const prisma = prismaMock(); prisma.vehicle.updateMany.mockResolvedValue({ count: 1 }); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', status: 'RESERVED' });
    await expect(new VehiclesService(prisma as never).reserveForSale('1', '12345678901', new Date())).resolves.toEqual({ id: '1', status: 'RESERVED' });
  });
  it('releases an existing reservation', async () => {
    const prisma = prismaMock(); prisma.vehicle.updateMany.mockResolvedValue({ count: 1 }); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', status: 'FOR_SALE' });
    await expect(new VehiclesService(prisma as never).releaseReservation('1')).resolves.toEqual({ id: '1', status: 'FOR_SALE' });
  });
  it('rejects releasing a missing reservation', async () => {
    const prisma = prismaMock(); prisma.vehicle.updateMany.mockResolvedValue({ count: 0 });
    await expect(new VehiclesService(prisma as never).releaseReservation('1')).rejects.toBeInstanceOf(ConflictException);
  });
  it('applies a payment webhook', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', paymentCode: 'pay', soldAt: null }); prisma.vehicle.update.mockResolvedValue({ id: '1', paymentStatus: 'PAID', status: 'SOLD' }); jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await expect(new VehiclesService(prisma as never).applyPayment({ paymentCode: 'pay', status: PaymentStatus.PAID })).resolves.toEqual(expect.objectContaining({ id: '1', paymentStatus: 'PAID', status: 'SOLD' }));
  });
  it('releases a reserved vehicle when payment is cancelled', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', paymentCode: 'pay', soldAt: new Date() }); prisma.vehicle.update.mockResolvedValue({ id: '1', paymentStatus: 'CANCELLED', status: 'FOR_SALE' }); jest.spyOn(global, 'fetch').mockRejectedValue(new Error('sales offline'));
    await expect(new VehiclesService(prisma as never).applyPayment({ paymentCode: 'pay', status: PaymentStatus.CANCELLED })).rejects.toThrow('Nao foi possivel sincronizar o pagamento');
    expect(prisma.vehicle.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'FOR_SALE' }) }));
  });
  it('rejects an unknown payment code', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue(null);
    await expect(new VehiclesService(prisma as never).applyPayment({ paymentCode: 'missing', status: PaymentStatus.PAID })).rejects.toBeInstanceOf(NotFoundException);
  });
  it('keeps the provider payment timestamp when supplied', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', paymentCode: 'pay', soldAt: null }); prisma.vehicle.update.mockResolvedValue({ id: '1', paymentStatus: 'PAID', status: 'SOLD' }); jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    await new VehiclesService(prisma as never).applyPayment({ paymentCode: 'pay', status: PaymentStatus.PAID, paidAt: '2026-09-03T10:00:00.000Z' });
    expect(prisma.vehicle.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ soldAt: new Date('2026-09-03T10:00:00.000Z') }) }));
  });
  it('does not cancel a confirmed sale', async () => {
    const prisma = prismaMock(); prisma.vehicle.findUnique.mockResolvedValue({ id: '1', paymentCode: 'pay', status: 'SOLD', paymentStatus: 'PAID' });
    await expect(new VehiclesService(prisma as never).applyPayment({ paymentCode: 'pay', status: PaymentStatus.CANCELLED })).rejects.toBeInstanceOf(ConflictException);
  });
});