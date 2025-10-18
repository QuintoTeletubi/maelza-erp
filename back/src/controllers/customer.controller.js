const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all customers with pagination and search
 */
const getCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      isActive 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause (SQLite compatible)
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { taxId: { contains: search } }
        ]
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      customers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch customers'
    });
  }
};

/**
 * Get customer by ID
 */
const getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            number: true,
            date: true,
            total: true,
            status: true
          },
          orderBy: { date: 'desc' },
          take: 5
        },
        receivables: {
          select: {
            id: true,
            amount: true,
            paidAmount: true,
            dueDate: true,
            status: true
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} not found`
      });
    }

    res.json({ customer });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch customer'
    });
  }
};

/**
 * Create new customer
 */
const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      taxId,
      creditLimit = 0
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Name is required'
      });
    }

    // Check if taxId already exists (if provided)
    if (taxId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { taxId }
      });

      if (existingCustomer) {
        return res.status(409).json({
          error: 'Customer already exists',
          message: 'A customer with this Tax ID already exists'
        });
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        taxId: taxId ? taxId.trim() : null,
        creditLimit: parseFloat(creditLimit) || 0,
        isActive: true,
        currentDebt: 0
      }
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate value',
        message: 'Tax ID already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create customer'
    });
  }
};

/**
 * Update customer
 */
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      taxId,
      creditLimit,
      isActive
    } = req.body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} not found`
      });
    }

    // Check if taxId already exists for another customer
    if (taxId && taxId !== existingCustomer.taxId) {
      const duplicateCustomer = await prisma.customer.findUnique({
        where: { taxId }
      });

      if (duplicateCustomer) {
        return res.status(409).json({
          error: 'Tax ID already exists',
          message: 'Another customer already has this Tax ID'
        });
      }
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(taxId !== undefined && { taxId: taxId ? taxId.trim() : null }),
        ...(creditLimit !== undefined && { creditLimit: parseFloat(creditLimit) || 0 }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate value',
        message: 'Tax ID already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update customer'
    });
  }
};

/**
 * Delete customer (soft delete)
 */
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: { take: 1 },
        receivables: { take: 1 }
      }
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
        message: `Customer with ID ${id} not found`
      });
    }

    // Check if customer has related data
    if (customer.sales.length > 0 || customer.receivables.length > 0) {
      // Soft delete - just deactivate
      const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: { isActive: false }
      });

      return res.json({
        message: 'Customer deactivated successfully (has related transactions)',
        customer: updatedCustomer
      });
    }

    // Hard delete if no related data
    await prisma.customer.delete({
      where: { id }
    });

    res.json({
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete customer'
    });
  }
};

/**
 * Get customer statistics
 */
const getCustomerStats = async (req, res) => {
  try {
    const stats = await prisma.customer.groupBy({
      by: ['isActive'],
      _count: {
        id: true
      }
    });

    const totalCustomers = await prisma.customer.count();
    const activeCustomers = stats.find(s => s.isActive)?._count.id || 0;
    const inactiveCustomers = stats.find(s => !s.isActive)?._count.id || 0;

    // Get top customers by total sales
    const topCustomers = await prisma.customer.findMany({
      include: {
        sales: {
          select: {
            total: true
          }
        }
      },
      take: 5
    });

    const topCustomersWithTotals = topCustomers
      .map(customer => ({
        ...customer,
        totalSales: customer.sales.reduce((sum, sale) => sum + sale.total, 0)
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    res.json({
      stats: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers
      },
      topCustomers: topCustomersWithTotals
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch customer statistics'
    });
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats
};