const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /api/purchases - Get all purchases with pagination and search
const getPurchases = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      supplierId = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    // Search in purchase number, supplier name or notes
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { supplier: { name: { contains: search } } },
        { notes: { contains: search } }
      ];
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by supplier
    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Get purchases with relations
    const purchases = await prisma.purchase.findMany({
      where,
      skip,
      take,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                unit: true
              }
            }
          }
        },
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.purchase.count({ where });

    const totalPages = Math.ceil(totalCount / take);

    res.json({
      purchases,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving purchases'
    });
  }
};

// GET /api/purchases/:id - Get single purchase
const getPurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            taxId: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                unit: true,
                costPrice: true
              }
            }
          }
        },
        payables: {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            dueDate: true,
            status: true
          }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The requested purchase does not exist'
      });
    }

    res.json(purchase);

  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving purchase'
    });
  }
};

// POST /api/purchases - Create new purchase
const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      date,
      notes = '',
      items = []
    } = req.body;

    const userId = req.user.id;

    // Validation
    if (!supplierId || !date || !items.length) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Supplier, date and items are required'
      });
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    });

    if (!supplier) {
      return res.status(404).json({
        error: 'Supplier not found',
        message: 'The specified supplier does not exist'
      });
    }

    // Verify all products exist
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds }
      }
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'One or more products do not exist'
      });
    }

    // Generate purchase number
    const lastPurchase = await prisma.purchase.findFirst({
      orderBy: { number: 'desc' },
      select: { number: true }
    });

    let nextNumber = 1;
    if (lastPurchase && lastPurchase.number) {
      const lastNumber = parseInt(lastPurchase.number.replace('COMP-', ''));
      nextNumber = lastNumber + 1;
    }
    const purchaseNumber = `COMP-${nextNumber.toString().padStart(6, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const validatedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice || product.costPrice);
      const total = quantity * unitPrice;
      
      subtotal += total;
      
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        total
      };
    });

    const tax = subtotal * 0.18; // 18% IGV
    const total = subtotal + tax;

    // Create purchase with items in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create purchase
      const newPurchase = await tx.purchase.create({
        data: {
          number: purchaseNumber,
          supplierId,
          userId,
          date: new Date(date),
          subtotal,
          tax,
          total,
          status: 'PENDING',
          notes: notes || null,
          items: {
            create: validatedItems
          }
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  unit: true
                }
              }
            }
          }
        }
      });

      return newPurchase;
    });

    res.status(201).json(purchase);

  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error creating purchase'
    });
  }
};

// PUT /api/purchases/:id - Update purchase
const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplierId,
      date,
      notes,
      status,
      items = []
    } = req.body;

    // Check if purchase exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingPurchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The requested purchase does not exist'
      });
    }

    // Verify supplier exists if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      });

      if (!supplier) {
        return res.status(404).json({
          error: 'Supplier not found',
          message: 'The specified supplier does not exist'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (supplierId) updateData.supplierId = supplierId;
    if (date) updateData.date = new Date(date);
    if (notes !== undefined) updateData.notes = notes || null;
    if (status) updateData.status = status;

    // If items are provided, recalculate totals
    if (items.length > 0) {
      // Verify all products exist
      const productIds = items.map(item => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        }
      });

      if (products.length !== productIds.length) {
        return res.status(404).json({
          error: 'Product not found',
          message: 'One or more products do not exist'
        });
      }

      // Calculate new totals
      let subtotal = 0;
      const validatedItems = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        const quantity = parseInt(item.quantity);
        const unitPrice = parseFloat(item.unitPrice || product.costPrice);
        const total = quantity * unitPrice;
        
        subtotal += total;
        
        return {
          productId: item.productId,
          quantity,
          unitPrice,
          total
        };
      });

      const tax = subtotal * 0.18;
      const total = subtotal + tax;

      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.total = total;
    }

    // Update purchase
    const purchase = await prisma.$transaction(async (tx) => {
      // Update purchase
      const updatedPurchase = await tx.purchase.update({
        where: { id },
        data: updateData,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  unit: true
                }
              }
            }
          }
        }
      });

      // Update items if provided
      if (items.length > 0) {
        // Delete existing items
        await tx.purchaseItem.deleteMany({
          where: { purchaseId: id }
        });

        // Get products for validation
        const productIds = items.map(item => item.productId);
        const products = await tx.product.findMany({
          where: {
            id: { in: productIds }
          },
          select: {
            id: true,
            name: true,
            costPrice: true,
            stock: true
          }
        });

        // Create new items
        const validatedItems = items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) {
            throw new Error(`Producto con ID ${item.productId} no encontrado`);
          }
          const quantity = parseInt(item.quantity);
          const unitPrice = parseFloat(item.unitPrice || product.costPrice);
          const total = quantity * unitPrice;
          
          return {
            purchaseId: id,
            productId: item.productId,
            quantity,
            unitPrice,
            total
          };
        });

        await tx.purchaseItem.createMany({
          data: validatedItems
        });

        // Update product stock if status is "received"
        if (status === 'received' || status === 'recibido') {
          for (const item of validatedItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      } else {
        // If no items are provided but status changed to received, update stock for existing items
        if ((status === 'received' || status === 'recibido') && existingPurchase.status !== status) {
          const existingItems = await tx.purchaseItem.findMany({
            where: { purchaseId: id },
            select: {
              productId: true,
              quantity: true
            }
          });

          for (const item of existingItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      return updatedPurchase;
    });

    res.json(purchase);

  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error updating purchase'
    });
  }
};

// DELETE /api/purchases/:id - Delete purchase
const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase exists
    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        payables: true
      }
    });

    if (!existingPurchase) {
      return res.status(404).json({
        error: 'Purchase not found',
        message: 'The requested purchase does not exist'
      });
    }

    // Check if purchase has paid accounts payable
    const hasPaidPayables = existingPurchase.payables.some(
      payable => payable.paidAmount > 0
    );

    if (hasPaidPayables) {
      return res.status(400).json({
        error: 'Cannot delete purchase',
        message: 'Purchase has payments and cannot be deleted'
      });
    }

    // Delete purchase and related data
    await prisma.$transaction(async (tx) => {
      // Delete purchase items (cascade should handle this)
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id }
      });

      // Delete accounts payable
      await tx.accountPayable.deleteMany({
        where: { purchaseId: id }
      });

      // Delete purchase
      await tx.purchase.delete({
        where: { id }
      });
    });

    res.json({
      message: 'Purchase deleted successfully'
    });

  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error deleting purchase'
    });
  }
};

// GET /api/purchases/stats - Get purchase statistics
const getPurchaseStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get statistics
    const [
      totalPurchases,
      pendingPurchases,
      completedPurchases,
      totalAmount,
      periodPurchases,
      periodAmount
    ] = await Promise.all([
      // Total purchases
      prisma.purchase.count(),
      
      // Pending purchases
      prisma.purchase.count({
        where: { status: 'PENDING' }
      }),
      
      // Completed purchases
      prisma.purchase.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Total amount
      prisma.purchase.aggregate({
        _sum: { total: true }
      }),
      
      // Period purchases
      prisma.purchase.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Period amount
      prisma.purchase.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startDate }
        }
      })
    ]);

    res.json({
      totalPurchases,
      pendingPurchases,
      completedPurchases,
      cancelledPurchases: totalPurchases - pendingPurchases - completedPurchases,
      totalAmount: totalAmount._sum.total || 0,
      periodPurchases,
      periodAmount: periodAmount._sum.total || 0,
      period
    });

  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving purchase statistics'
    });
  }
};

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
  getPurchaseStats
};