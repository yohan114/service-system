import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      email: 'admin@example.com',
    },
  });

  console.log(`Created admin user: ${admin.username} (ID: ${admin.id})`);

  // Create sample staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'John Technician',
      role: 'STAFF',
      email: 'staff@example.com',
    },
  });

  console.log(`Created staff user: ${staff.username} (ID: ${staff.id})`);

  // Create sample cashier
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      password: cashierPassword,
      name: 'Jane Cashier',
      role: 'CASHIER',
      email: 'cashier@example.com',
    },
  });

  console.log(`Created cashier user: ${cashier.username} (ID: ${cashier.id})`);

  // Create sample inventory items
  const oilFilter = await prisma.inventoryItem.create({
    data: {
      name: 'Oil Filter - Universal',
      category: 'FILTER',
      quantity: 50,
      unitPrice: 8.99,
      reorderLevel: 10,
      unit: 'pcs',
    },
  });

  const engineOil = await prisma.inventoryItem.create({
    data: {
      name: 'Engine Oil 5W-30 (1L)',
      category: 'OIL',
      quantity: 100,
      unitPrice: 12.50,
      reorderLevel: 20,
      unit: 'liters',
    },
  });

  const brakepad = await prisma.inventoryItem.create({
    data: {
      name: 'Brake Pad Set - Front',
      category: 'SPARE_PART',
      quantity: 25,
      unitPrice: 45.00,
      reorderLevel: 5,
      unit: 'sets',
    },
  });

  console.log(`Created ${3} inventory items`);

  // Create sample customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Ahmad bin Ibrahim',
      phone: '012-3456789',
      email: 'ahmad@example.com',
      address: '123 Jalan Maju, Kuala Lumpur',
    },
  });

  console.log(`Created customer: ${customer.name} (ID: ${customer.id})`);

  // Create sample vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: customer.id,
      registrationNumber: 'WA 1234 B',
      model: 'Civic',
      brand: 'Honda',
      year: 2020,
      mileageOrHours: 45000,
      type: 'VEHICLE',
    },
  });

  console.log(`Created vehicle: ${vehicle.registrationNumber} (ID: ${vehicle.id})`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
