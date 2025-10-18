#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deploy() {
  console.log('🚀 Iniciando despliegue de base de datos...');

  try {
    // Ejecutar prisma db push
    console.log('📋 Creando tablas en la base de datos...');
    const { stdout: pushOutput, stderr: pushError } = await execAsync('npx prisma db push');
    
    if (pushError) {
      console.log('ℹ️ Info de Prisma:', pushError);
    }
    console.log(pushOutput);

    // Ejecutar seed si existe
    console.log('🌱 Ejecutando seed de datos iniciales...');
    const { stdout: seedOutput, stderr: seedError } = await execAsync('node prisma/seed.js');
    
    if (seedError) {
      console.log('ℹ️ Info de seed:', seedError);
    }
    console.log(seedOutput);

    console.log('✅ Despliegue completado exitosamente!');
  } catch (error) {
    console.error('❌ Error durante el despliegue:', error.message);
    process.exit(1);
  }
}

deploy();