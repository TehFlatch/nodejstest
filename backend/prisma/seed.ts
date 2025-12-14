import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../node_modules/.prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment early to ensure DATABASE_URL is available for Prisma
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean up existing data
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      name: 'Tenant A',
      slug: 'tenant-a',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      name: 'Tenant B',
      slug: 'tenant-b',
    },
  });

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create users for Tenant A
  await prisma.user.create({
    data: {
      email: 'admin@tenant-a.com',
      password: adminPassword,
      name: 'Admin A',
      role: 'admin',
      tenantId: tenant1.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'user@tenant-a.com',
      password: userPassword,
      name: 'User A',
      role: 'member',
      tenantId: tenant1.id,
    },
  });

  // Create users for Tenant B
  await prisma.user.create({
    data: {
      email: 'admin@tenant-b.com',
      password: adminPassword,
      name: 'Admin B',
      role: 'admin',
      tenantId: tenant2.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'user@tenant-b.com',
      password: userPassword,
      name: 'User B',
      role: 'member',
      tenantId: tenant2.id,
    },
  });

  // Create projects for Tenant A
  const projectA1 = await prisma.project.create({
    data: {
      title: 'Web App Development',
      description: 'Developing a modern web application for Tenant A',
      status: 'active',
      tenantId: tenant1.id,
    },
  });

  const projectA2 = await prisma.project.create({
    data: {
      title: 'API Integration',
      description: 'Integrating third-party APIs for Tenant A',
      status: 'in-progress',
      tenantId: tenant1.id,
    },
  });

  // Create tasks for Tenant A projects
  await prisma.task.create({
    data: {
      title: 'Design UI Mockups',
      description: 'Create wireframes and mockups for the web app',
      status: 'completed',
      projectId: projectA1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Implement Frontend',
      description: 'Build the frontend using Angular',
      status: 'in-progress',
      projectId: projectA1.id,
      tenantId: tenant1.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Setup API Endpoints',
      description: 'Configure REST API endpoints',
      status: 'todo',
      projectId: projectA2.id,
      tenantId: tenant1.id,
    },
  });

  // Create projects for Tenant B
  const projectB1 = await prisma.project.create({
    data: {
      title: 'Mobile App Launch',
      description: 'Launching a mobile application for Tenant B',
      status: 'active',
      tenantId: tenant2.id,
    },
  });

  const projectB2 = await prisma.project.create({
    data: {
      title: 'Database Optimization',
      description: 'Optimizing database performance for Tenant B',
      status: 'planning',
      tenantId: tenant2.id,
    },
  });

  // Create tasks for Tenant B projects
  await prisma.task.create({
    data: {
      title: 'Develop iOS App',
      description: 'Build the iOS version of the mobile app',
      status: 'in-progress',
      projectId: projectB1.id,
      tenantId: tenant2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Test Android Version',
      description: 'QA testing for Android app',
      status: 'todo',
      projectId: projectB1.id,
      tenantId: tenant2.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Analyze Query Performance',
      description: 'Review and optimize slow database queries',
      status: 'completed',
      projectId: projectB2.id,
      tenantId: tenant2.id,
    },
  });

  console.log('Seeding completed: Created 2 tenants with users, projects, and tasks.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });