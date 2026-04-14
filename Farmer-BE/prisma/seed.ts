import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = '123123';

type LoginSeedAccount = {
  email: string;
  fullName: string;
  phone: string;
  role: Role;
};

type FarmerSeedRecord = {
  fullName: string;
  phone: string;
  cccd: string;
  bankAccount?: string;
  address?: string;
  province?: string;
  assignToSupervisor?: boolean;
};

const ACCOUNTS: LoginSeedAccount[] = [
  {
    email: 'admin@farmers.com',
    fullName: 'Quản Trị Viên',
    phone: '0123456789',
    role: Role.ADMIN,
  },
  {
    email: 'supervisor@farmers.com',
    fullName: 'Giám Sát Viên',
    phone: '0912333444',
    role: Role.SUPERVISOR,
  },
  {
    email: 'inventory@farmers.com',
    fullName: 'Quản Lý Kho',
    phone: '0944555666',
    role: Role.INVENTORY,
  },
  {
    email: 'client@farmers.com',
    fullName: 'Khách Hàng',
    phone: '0987654321',
    role: Role.CLIENT,
  },
];

const FARMERS: FarmerSeedRecord[] = [
  {
    fullName: 'Nguyen Van Khoa',
    phone: '0903000001',
    cccd: '079123456701',
    bankAccount: '9704361234567890',
    address: 'Thon Dong, Dong Anh',
    province: 'Ha Noi',
    assignToSupervisor: true,
  },
  {
    fullName: 'Tran Thi Lan',
    phone: '0903000002',
    cccd: '079123456702',
    bankAccount: '9704361234567891',
    address: 'Xa Phu Cuong, Soc Son',
    province: 'Ha Noi',
    assignToSupervisor: true,
  },
  {
    fullName: 'Le Van Binh',
    phone: '0903000003',
    cccd: '079123456703',
    bankAccount: '9704361234567892',
    address: 'Xa Yen Bai, Ba Vi',
    province: 'Ha Noi',
    assignToSupervisor: false,
  },
  {
    fullName: 'Pham Thi Hoa',
    phone: '0903000004',
    cccd: '079123456704',
    bankAccount: '9704361234567893',
    address: 'Xa Nguyen Khe, Dong Anh',
    province: 'Ha Noi',
    assignToSupervisor: false,
  },
];

async function clearNonAuthData() {
  // Delete domain data first (children before parents) to satisfy FK constraints.
  await prisma.$transaction([
    prisma.warehouseTransaction.deleteMany(),
    prisma.inventoryLot.deleteMany(),
    prisma.warehouse.deleteMany(),
    prisma.review.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.productCategory.deleteMany(),
    prisma.product.deleteMany(),
    prisma.contract.deleteMany(),
    prisma.dailyReport.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.plot.deleteMany(),
    prisma.farmer.deleteMany(),
    prisma.zone.deleteMany(),
    prisma.priceBoard.deleteMany(),
    prisma.category.deleteMany(),
    prisma.clientShippingAddress.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.passwordReset.deleteMany(),
  ]);
}

async function upsertLoginUsersOnly() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const adminAccount = ACCOUNTS.find((account) => account.role === Role.ADMIN);
  if (!adminAccount) {
    throw new Error('Admin account seed config is missing');
  }

  const adminUser = await prisma.user.upsert({
    where: { email: adminAccount.email },
    update: {
      fullName: adminAccount.fullName,
      phone: adminAccount.phone,
      role: adminAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: adminAccount.email,
      fullName: adminAccount.fullName,
      phone: adminAccount.phone,
      role: adminAccount.role,
      passwordHash: hashedPassword,
    },
  });

  const adminProfile = await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      businessName: 'Farmers Core',
      province: 'Hà Nội',
      taxCode: null,
      bankAccount: null,
    },
    create: {
      userId: adminUser.id,
      businessName: 'Farmers Core',
      province: 'Hà Nội',
      taxCode: null,
      bankAccount: null,
    },
  });

  const supervisorAccount = ACCOUNTS.find(
    (account) => account.role === Role.SUPERVISOR,
  );
  if (!supervisorAccount) {
    throw new Error('Supervisor account seed config is missing');
  }

  const supervisorUser = await prisma.user.upsert({
    where: { email: supervisorAccount.email },
    update: {
      fullName: supervisorAccount.fullName,
      phone: supervisorAccount.phone,
      role: supervisorAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: supervisorAccount.email,
      fullName: supervisorAccount.fullName,
      phone: supervisorAccount.phone,
      role: supervisorAccount.role,
      passwordHash: hashedPassword,
    },
  });

  const supervisorProfile = await prisma.supervisorProfile.upsert({
    where: { userId: supervisorUser.id },
    update: {
      adminId: adminProfile.id,
      employeeCode: 'SUP-000001',
      zoneId: null,
    },
    create: {
      userId: supervisorUser.id,
      adminId: adminProfile.id,
      employeeCode: 'SUP-000001',
      zoneId: null,
    },
  });

  const inventoryAccount = ACCOUNTS.find(
    (account) => account.role === Role.INVENTORY,
  );
  if (!inventoryAccount) {
    throw new Error('Inventory account seed config is missing');
  }

  const inventoryUser = await prisma.user.upsert({
    where: { email: inventoryAccount.email },
    update: {
      fullName: inventoryAccount.fullName,
      phone: inventoryAccount.phone,
      role: inventoryAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: inventoryAccount.email,
      fullName: inventoryAccount.fullName,
      phone: inventoryAccount.phone,
      role: inventoryAccount.role,
      passwordHash: hashedPassword,
    },
  });

  await prisma.inventoryProfile.upsert({
    where: { userId: inventoryUser.id },
    update: {
      adminId: adminProfile.id,
      employeeCode: 'INV-000001',
    },
    create: {
      userId: inventoryUser.id,
      adminId: adminProfile.id,
      employeeCode: 'INV-000001',
    },
  });

  const clientAccount = ACCOUNTS.find((account) => account.role === Role.CLIENT);
  if (!clientAccount) {
    throw new Error('Client account seed config is missing');
  }

  const clientUser = await prisma.user.upsert({
    where: { email: clientAccount.email },
    update: {
      fullName: clientAccount.fullName,
      phone: clientAccount.phone,
      role: clientAccount.role,
      passwordHash: hashedPassword,
    },
    create: {
      email: clientAccount.email,
      fullName: clientAccount.fullName,
      phone: clientAccount.phone,
      role: clientAccount.role,
      passwordHash: hashedPassword,
    },
  });

  await prisma.clientProfile.upsert({
    where: { userId: clientUser.id },
    update: {
      adminId: adminProfile.id,
      province: 'Hà Nội',
    },
    create: {
      userId: clientUser.id,
      adminId: adminProfile.id,
      province: 'Hà Nội',
    },
  });

  console.log('[SEED] Login accounts are ready:');
  for (const account of ACCOUNTS) {
    console.log(`       ${account.role} -> ${account.email} / ${DEFAULT_PASSWORD}`);
  }

  return {
    adminProfile,
    supervisorProfile,
  };
}

async function upsertFarmers(params: {
  adminProfileId: string;
  supervisorProfileId: string;
}) {
  for (const farmer of FARMERS) {
    await prisma.farmer.upsert({
      where: { cccd: farmer.cccd },
      update: {
        adminId: params.adminProfileId,
        fullName: farmer.fullName,
        phone: farmer.phone,
        bankAccount: farmer.bankAccount,
        address: farmer.address,
        province: farmer.province,
        supervisorId: farmer.assignToSupervisor
          ? params.supervisorProfileId
          : null,
      },
      create: {
        adminId: params.adminProfileId,
        fullName: farmer.fullName,
        phone: farmer.phone,
        cccd: farmer.cccd,
        bankAccount: farmer.bankAccount,
        address: farmer.address,
        province: farmer.province,
        supervisorId: farmer.assignToSupervisor
          ? params.supervisorProfileId
          : null,
      },
    });
  }

  console.log(`[SEED] Farmers are ready: ${FARMERS.length} records`);
}

async function main() {
  console.log('\n========================================');
  console.log('  FARMERS — AUTH-ONLY DATABASE SEED');
  console.log('========================================\n');

  await clearNonAuthData();
  console.log('[SEED] Cleared non-auth tables');

  const authContext = await upsertLoginUsersOnly();
  await upsertFarmers({
    adminProfileId: authContext.adminProfile.id,
    supervisorProfileId: authContext.supervisorProfile.id,
  });

  console.log('\n========================================');
  console.log('  SEED COMPLETE');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('[SEED] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
