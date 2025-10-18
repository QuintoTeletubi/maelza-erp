const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');

// Cargar variables de entorno
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({
    message: 'MAELZA ERP API - Backend funcionando correctamente',
    version: '1.0.0',
    status: 'OK'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    res.json({
      message: 'Database connection successful',
      stats: {
        users: userCount,
        roles: roleCount
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Importar rutas
console.log('Loading auth routes...');
app.use('/api/auth', require('./routes/auth.routes'));
console.log('Loading customer routes...');
app.use('/api/customers', require('./routes/customer.routes'));
console.log('Loading product routes...');
app.use('/api/products', require('./routes/product.routes'));
console.log('Loading supplier routes...');
app.use('/api/suppliers', require('./routes/supplier.routes'));
console.log('Loading purchase routes...');
app.use('/api/purchases', require('./routes/purchase.routes'));
console.log('Loading sale routes...');
app.use('/api/sales', require('./routes/sale.routes'));
console.log('Loading dashboard routes...');
app.use('/api/dashboard', require('./routes/dashboard.routes'));
console.log('All routes loaded successfully');
// app.use('/api/users', require('./routes/user.routes'));

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📡 API disponible en: http://localhost:${PORT}`);
  console.log(`🔍 Test DB: http://localhost:${PORT}/api/test-db`);
});

module.exports = app;