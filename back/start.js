#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function start() {
  console.log('🚀 Iniciando aplicación MAELZA ERP...');

  // Solo ejecutar deploy en producción si está habilitado
  if (process.env.RUN_DEPLOY === 'true' && process.env.NODE_ENV === 'production') {
    console.log('🔧 Ejecutando configuración inicial de base de datos...');
    
    try {
      const { stdout, stderr } = await execAsync('npm run deploy');
      console.log(stdout);
      if (stderr) console.log('Info:', stderr);
    } catch (error) {
      console.error('❌ Error en la configuración inicial:', error.message);
      console.log('ℹ️ La aplicación continuará ejecutándose...');
    }
  }

  // Iniciar el servidor
  console.log('🚀 Iniciando servidor...');
  require('./src/server.js');
}

start();