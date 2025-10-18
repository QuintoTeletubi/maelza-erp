const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../src/utils/password.util');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator - Full system access',
      permissions: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'customers.create',
        'customers.read',
        'customers.update',
        'customers.delete',
        'suppliers.create',
        'suppliers.read',
        'suppliers.update',
        'suppliers.delete',
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'sales.create',
        'sales.read',
        'sales.update',
        'sales.delete',
        'purchases.create',
        'purchases.read',
        'purchases.update',
        'purchases.delete',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'inventory.delete',
        'reports.read',
        'settings.update'
      ]
    }
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'manager' },
    update: {},
    create: {
      name: 'manager',
      description: 'Manager - Operations access',
      permissions: [
        'customers.create',
        'customers.read',
        'customers.update',
        'suppliers.create',
        'suppliers.read',
        'suppliers.update',
        'products.create',
        'products.read',
        'products.update',
        'sales.create',
        'sales.read',
        'sales.update',
        'purchases.create',
        'purchases.read',
        'purchases.update',
        'inventory.read',
        'inventory.update',
        'reports.read'
      ]
    }
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'employee' },
    update: {},
    create: {
      name: 'employee',
      description: 'Employee - Basic operations',
      permissions: [
        'customers.read',
        'suppliers.read',
        'products.read',
        'sales.create',
        'sales.read',
        'purchases.read',
        'inventory.read'
      ]
    }
  });

  console.log('✅ Roles created');

  // Create default admin user
  const hashedPassword = await hashPassword('admin123');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@maelza.com' },
    update: {},
    create: {
      email: 'admin@maelza.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'MAELZA',
      roleId: adminRole.id,
      isActive: true
    }
  });

  console.log('✅ Admin user created');

  // Create default categories
  const categories = [
    { name: 'Materias Primas', description: 'Materiales base para producción' },
    { name: 'Productos Terminados', description: 'Productos listos para venta' },
    { name: 'Insumos', description: 'Materiales auxiliares' },
    { name: 'Herramientas', description: 'Herramientas y equipos' }
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    });
  }

  console.log('✅ Categories created');

  // Create default warehouse
  await prisma.warehouse.upsert({
    where: { name: 'Almacén Principal' },
    update: {},
    create: {
      name: 'Almacén Principal',
      location: 'Sede Central',
      isActive: true
    }
  });

  console.log('✅ Warehouse created');

  console.log('🎉 Database seeded successfully!');
  console.log('📧 Admin credentials:');
  console.log('   Email: admin@maelza.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });