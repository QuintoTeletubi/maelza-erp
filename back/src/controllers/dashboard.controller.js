const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Get current month sales
    const currentMonthSales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Get last month sales for comparison
    const lastMonthSales = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Get current month purchases
    const currentMonthPurchases = await prisma.purchase.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        total: true
      },
      _count: true
    });

    // Get total products and low stock products
    const totalProducts = await prisma.product.count({
      where: { isActive: true }
    });

    // Get low stock products with a custom query
    const lowStockProducts = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM products 
      WHERE isActive = 1 AND stock <= minStock
    `;
    
    // Convert BigInt to Number
    const lowStockCount = Number(lowStockProducts[0]?.count || 0);

    // Get total customers
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      prisma.customer.count({
        where: { isActive: true }
      }),
      prisma.customer.count({
        where: {
          isActive: true,
          createdAt: {
            gte: startOfMonth
          }
        }
      })
    ]);

    // Get pending sales (accounts receivable)
    const pendingReceivables = await prisma.accountReceivable.aggregate({
      where: {
        status: {
          in: ['PENDING', 'PARTIAL']
        }
      },
      _sum: {
        amount: true,
        paidAmount: true
      }
    });

    // Calculate pending amount
    const pendingAmount = (pendingReceivables._sum.amount || 0) - (pendingReceivables._sum.paidAmount || 0);

    // Calculate changes
    const salesChange = lastMonthSales._sum.total 
      ? ((currentMonthSales._sum.total || 0) - lastMonthSales._sum.total) / lastMonthSales._sum.total * 100
      : 0;

    const salesCountChange = lastMonthSales._count 
      ? ((currentMonthSales._count || 0) - lastMonthSales._count) / lastMonthSales._count * 100
      : 0;

    // Get inventory value
    const inventoryValue = await prisma.product.aggregate({
      where: { isActive: true },
      _sum: {
        stock: true
      }
    });

    // Get products with their stock value
    const productsWithValue = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        stock: true,
        costPrice: true
      }
    });

    const totalInventoryValue = productsWithValue.reduce((sum, product) => {
      return sum + (product.stock * product.costPrice);
    }, 0);

    // Helper function to convert BigInt to Number
    const toNumber = (value) => {
      if (typeof value === 'bigint') {
        return Number(value);
      }
      return value || 0;
    };

    res.json({
      sales: {
        total: toNumber(currentMonthSales._sum.total),
        count: toNumber(currentMonthSales._count),
        change: Number(salesChange.toFixed(1)),
        countChange: Number(salesCountChange.toFixed(1))
      },
      purchases: {
        total: toNumber(currentMonthPurchases._sum.total),
        count: toNumber(currentMonthPurchases._count)
      },
      inventory: {
        totalProducts: toNumber(totalProducts),
        lowStockProducts: lowStockCount,
        totalValue: Number(totalInventoryValue.toFixed(2)),
        totalUnits: toNumber(inventoryValue._sum.stock)
      },
      customers: {
        total: toNumber(totalCustomers),
        newThisMonth: toNumber(newCustomersThisMonth)
      },
      financials: {
        pendingReceivables: Number(pendingAmount.toFixed(2))
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

/**
 * Get monthly sales data for charts
 */
const getMonthlySales = async (req, res) => {
  try {
    const currentDate = new Date();
    const monthsBack = 6; // Last 6 months
    
    const salesByMonth = [];
    
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthSales = await prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        },
        _sum: {
          total: true
        },
        _count: true
      });

      // Helper function to convert BigInt to Number
      const toNumber = (value) => {
        if (typeof value === 'bigint') {
          return Number(value);
        }
        return value || 0;
      };

      salesByMonth.push({
        month: date.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' }),
        sales: toNumber(monthSales._sum.total),
        count: toNumber(monthSales._count),
        date: date.toISOString()
      });
    }

    res.json({
      monthlySales: salesByMonth
    });

  } catch (error) {
    console.error('Get monthly sales error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch monthly sales data'
    });
  }
};

module.exports = {
  getDashboardStats,
  getMonthlySales
};