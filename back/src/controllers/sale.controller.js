const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/sales - Get all sales with pagination and search
const getSales = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      customerId,
      startDate,
      endDate,
      status
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      AND: []
    };

    // Search filter
    if (search) {
      where.AND.push({
        OR: [
          {
            number: {
              contains: search
            }
          },
          {
            customer: {
              name: {
                contains: search
              }
            }
          },
          {
            notes: {
              contains: search
            }
          }
        ]
      });
    }

    // Customer filter
    if (customerId) {
      where.AND.push({
        customerId: customerId
      });
    }

    // Date range filter
    if (startDate && endDate) {
      where.AND.push({
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      });
    }

    // Status filter
    if (status) {
      where.AND.push({
        status: status
      });
    }

    // If no filters, remove AND clause
    const finalWhere = where.AND.length > 0 ? where : {};

    // Get sales with related data
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: finalWhere,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
                  salePrice: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: parseInt(limit)
      }),
      prisma.sale.count({
        where: finalWhere
      })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    res.json({
      sales,
      pagination: {
        current: parseInt(page),
        total: totalPages,
        hasNext,
        hasPrev,
        count: total
      }
    });

  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving sales'
    });
  }
};

// GET /api/sales/stats - Get sales statistics
const getSaleStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }

    const [
      totalSales,
      totalAmount,
      pendingSales,
      completedSales,
      recentSales
    ] = await Promise.all([
      // Total sales count
      prisma.sale.count({
        where: dateFilter
      }),
      
      // Total sales amount
      prisma.sale.aggregate({
        where: dateFilter,
        _sum: {
          total: true
        }
      }),
      
      // Pending sales
      prisma.sale.count({
        where: {
          ...dateFilter,
          status: 'pending'
        }
      }),
      
      // Completed sales
      prisma.sale.count({
        where: {
          ...dateFilter,
          status: 'completed'
        }
      }),
      
      // Recent sales (last 5)
      prisma.sale.findMany({
        where: dateFilter,
        include: {
          customer: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ]);

    res.json({
      totalSales,
      totalAmount: totalAmount._sum.total || 0,
      pendingSales,
      completedSales,
      recentSales
    });

  } catch (error) {
    console.error('Get sale stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving sale statistics'
    });
  }
};

// GET /api/sales/:id - Get sale by ID
const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            taxId: true,
            address: true
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
                salePrice: true,
                stock: true
              }
            }
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({
        error: 'Sale not found',
        message: 'The requested sale does not exist'
      });
    }

    res.json(sale);

  } catch (error) {
    console.error('Get sale by ID error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error retrieving sale'
    });
  }
};

// POST /api/sales - Create new sale
const createSale = async (req, res) => {
  try {
    const {
      customerId,
      date = new Date(),
      notes,
      status = 'pending',
      items = []
    } = req.body;

    const userId = req.user.id;

    // Validations
    if (!customerId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Customer ID is required'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'At least one item is required'
      });
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: 'The specified customer does not exist'
      });
    }

    // Verify all products exist and have sufficient stock
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

    // Check stock availability
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      const requestedQuantity = parseInt(item.quantity);
      
      if (requestedQuantity <= 0) {
        return res.status(400).json({
          error: 'Invalid quantity',
          message: `Quantity for product ${product.name} must be greater than 0`
        });
      }
      
      if (product.stock < requestedQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Not enough stock for product ${product.name}. Available: ${product.stock}, Required: ${requestedQuantity}`
        });
      }
    }

    // Calculate totals
    let subtotal = 0;
    const validatedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice || product.salePrice);
      const total = quantity * unitPrice;
      
      subtotal += total;
      
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        total
      };
    });

    const tax = subtotal * 0.18; // 18% tax
    const total = subtotal + tax;

    // Generate invoice number
    const year = new Date().getFullYear();
    const lastSale = await prisma.sale.findFirst({
      where: {
        number: {
          startsWith: `V${year}-`
        }
      },
      orderBy: {
        number: 'desc'
      }
    });

    let invoiceNumber;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.number.split('-')[1]);
      invoiceNumber = `V${year}-${String(lastNumber + 1).padStart(6, '0')}`;
    } else {
      invoiceNumber = `V${year}-000001`;
    }

    // Create sale with transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          number: invoiceNumber,
          customerId,
          userId,
          date: new Date(date),
          subtotal,
          tax,
          total,
          status,
          notes: notes || null,
          items: {
            create: validatedItems
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
                  salePrice: true
                }
              }
            }
          }
        }
      });

      // Update product stock if status is completed
      if (status === 'completed') {
        for (const item of validatedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          });
        }
      }

      return newSale;
    });

    res.status(201).json(sale);

  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error creating sale'
    });
  }
};

// PUT /api/sales/:id - Update sale
const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      customerId,
      date,
      notes,
      status,
      items = []
    } = req.body;

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingSale) {
      return res.status(404).json({
        error: 'Sale not found',
        message: 'The requested sale does not exist'
      });
    }

    // Prepare update data
    const updateData = {};
    if (customerId) updateData.customerId = customerId;
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
        const unitPrice = parseFloat(item.unitPrice || product.salePrice);
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

    // Update sale
    const sale = await prisma.$transaction(async (tx) => {
      // Update sale
      const updatedSale = await tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
                  salePrice: true
                }
              }
            }
          }
        }
      });

      // Update items if provided
      if (items.length > 0) {
        // Delete existing items
        await tx.saleItem.deleteMany({
          where: { saleId: id }
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
            salePrice: true,
            stock: true
          }
        });

        // Create new items
        const validatedItems = items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          const quantity = parseInt(item.quantity);
          const unitPrice = parseFloat(item.unitPrice || product.salePrice);
          const total = quantity * unitPrice;
          
          return {
            saleId: id,
            productId: item.productId,
            quantity,
            unitPrice,
            total
          };
        });

        await tx.saleItem.createMany({
          data: validatedItems
        });

        // Update product stock if status is "completed"
        if (status === 'completed' && existingSale.status !== status) {
          for (const item of validatedItems) {
            const product = products.find(p => p.id === item.productId);
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`);
            }
            
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
      } else {
        // If no items are provided but status changed to completed, update stock for existing items
        if (status === 'completed' && existingSale.status !== status) {
          const existingItems = await tx.saleItem.findMany({
            where: { saleId: id },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  stock: true
                }
              }
            }
          });

          for (const item of existingItems) {
            if (item.product.stock < item.quantity) {
              throw new Error(`Insufficient stock for product ${item.product.name}. Available: ${item.product.stock}, Required: ${item.quantity}`);
            }
            
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            });
          }
        }

        // If status changed from completed to pending, restore stock
        if (status === 'pending' && existingSale.status === 'completed') {
          const existingItems = await tx.saleItem.findMany({
            where: { saleId: id },
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

      return updatedSale;
    });

    res.json(sale);

  } catch (error) {
    console.error('Update sale error:', error);
    
    if (error.message && error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: error.message
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error updating sale'
    });
  }
};

// DELETE /api/sales/:id - Delete sale
const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!existingSale) {
      return res.status(404).json({
        error: 'Sale not found',
        message: 'The requested sale does not exist'
      });
    }

    // Cannot delete completed sales that already affected stock
    if (existingSale.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete sale',
        message: 'Cannot delete completed sales. Change status to pending first.'
      });
    }

    // Delete sale and related data
    await prisma.$transaction(async (tx) => {
      // Delete sale items
      await tx.saleItem.deleteMany({
        where: { saleId: id }
      });

      // Delete sale
      await tx.sale.delete({
        where: { id }
      });
    });

    res.json({
      message: 'Sale deleted successfully'
    });

  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Error deleting sale'
    });
  }
};

module.exports = {
  getSales,
  getSaleStats,
  getSaleById,
  createSale,
  updateSale,
  deleteSale
};