const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all products with pagination, search and filters
 */
const getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      categoryId,
      isActive,
      lowStock = false
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause (SQLite compatible)
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          { description: { contains: search } }
        ]
      }),
      ...(categoryId && { categoryId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' })
    };

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    // Filter low stock if requested
    let filteredProducts = products;
    if (lowStock === 'true') {
      // Get current stock for each product
      const productsWithStock = await Promise.all(
        products.map(async (product) => {
          const stockMoves = await prisma.inventoryMove.groupBy({
            by: ['type'],
            where: { productId: product.id },
            _sum: { quantity: true }
          });

          const inMoves = stockMoves.find(move => move.type === 'IN')?._sum.quantity || 0;
          const outMoves = stockMoves.find(move => move.type === 'OUT')?._sum.quantity || 0;
          const currentStock = inMoves - outMoves;

          return {
            ...product,
            currentStock,
            isLowStock: currentStock <= product.minStock
          };
        })
      );

      filteredProducts = lowStock === 'true' 
        ? productsWithStock.filter(p => p.isLowStock)
        : productsWithStock;
    }

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      products: filteredProducts,
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
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch products'
    });
  }
};

/**
 * Get product by ID with stock info
 */
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryMoves: {
          select: {
            id: true,
            type: true,
            quantity: true,
            unitCost: true,
            reference: true,
            notes: true,
            createdAt: true,
            warehouse: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} not found`
      });
    }

    // Calculate current stock
    const stockMoves = await prisma.inventoryMove.groupBy({
      by: ['type'],
      where: { productId: id },
      _sum: { quantity: true }
    });

    const inMoves = stockMoves.find(move => move.type === 'IN')?._sum.quantity || 0;
    const outMoves = stockMoves.find(move => move.type === 'OUT')?._sum.quantity || 0;
    const currentStock = inMoves - outMoves;

    res.json({ 
      product: {
        ...product,
        currentStock,
        isLowStock: currentStock <= product.minStock
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch product'
    });
  }
};

/**
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    console.log('📦 Creating product - Request body:', req.body);
    
    const {
      code,
      name,
      description,
      categoryId,
      unit = 'UNIT',
      costPrice = 0,
      salePrice = 0,
      stock = 0,
      minStock = 0
    } = req.body;

    console.log('📦 Extracted fields:', { code, name, categoryId, salePrice, stock });

    // Validate required fields
    if (!code || !name || !categoryId) {
      console.log('❌ Validation failed:', { code: !!code, name: !!name, categoryId: !!categoryId });
      return res.status(400).json({
        error: 'Validation error',
        message: 'Code, name, and category are required'
      });
    }

    // Check if code already exists
    const existingProduct = await prisma.product.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (existingProduct) {
      return res.status(409).json({
        error: 'Product already exists',
        message: 'A product with this code already exists'
      });
    }

    // Find or create category
    let category = await prisma.category.findFirst({
      where: { name: categoryId }
    });

    if (!category) {
      // Create category if it doesn't exist
      category = await prisma.category.create({
        data: {
          name: categoryId,
          description: `Categoría creada automáticamente: ${categoryId}`
        }
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description ? description.trim() : null,
        categoryId: category.id,
        unit,
        costPrice: parseFloat(costPrice) || 0,
        salePrice: parseFloat(salePrice) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate value',
        message: 'Product code already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create product'
    });
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      name,
      description,
      categoryId,
      unit,
      costPrice,
      salePrice,
      stock,
      minStock,
      isActive
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} not found`
      });
    }

    // Check if code already exists for another product
    if (code && code !== existingProduct.code) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { code: code.trim().toUpperCase() }
      });

      if (duplicateProduct) {
        return res.status(409).json({
          error: 'Code already exists',
          message: 'Another product already has this code'
        });
      }
    }

    // Find or create category if provided
    let categoryToUse = existingProduct.categoryId;
    if (categoryId && categoryId !== existingProduct.categoryId) {
      let category = await prisma.category.findFirst({
        where: { name: categoryId }
      });

      if (!category) {
        // Create category if it doesn't exist
        category = await prisma.category.create({
          data: {
            name: categoryId,
            description: `Categoría creada automáticamente: ${categoryId}`
          }
        });
      }
      categoryToUse = category.id;
    }

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(code && { code: code.trim().toUpperCase() }),
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(categoryId && { categoryId: categoryToUse }),
        ...(unit && { unit }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) || 0 }),
        ...(salePrice !== undefined && { salePrice: parseFloat(salePrice) || 0 }),
        ...(stock !== undefined && { stock: parseInt(stock) || 0 }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) || 0 }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Duplicate value',
        message: 'Product code already exists'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update product'
    });
  }
};

/**
 * Delete product (soft delete)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        inventoryMoves: { take: 1 },
        saleItems: { take: 1 },
        purchaseItems: { take: 1 }
      }
    });

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `Product with ID ${id} not found`
      });
    }

    // Check if product has related data
    if (product.inventoryMoves.length > 0 || 
        product.saleItems.length > 0 || 
        product.purchaseItems.length > 0) {
      
      // Soft delete - just deactivate
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false }
      });

      return res.json({
        message: 'Product deactivated successfully (has related transactions)',
        product: updatedProduct
      });
    }

    // Hard delete if no related data
    await prisma.product.delete({
      where: { id }
    });

    res.json({
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete product'
    });
  }
};

/**
 * Get product statistics
 */
const getProductStats = async (req, res) => {
  try {
    // Total products
    const total = await prisma.product.count({
      where: { isActive: true }
    });

    // Out of stock products (stock = 0)
    const outOfStock = await prisma.product.count({
      where: {
        isActive: true,
        stock: 0
      }
    });

    // Low stock products - necesitamos hacer esto diferente porque no podemos comparar campos directamente
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { stock: true, minStock: true }
    });

    const lowStock = allProducts.filter(product => 
      product.stock > 0 && product.stock <= product.minStock
    ).length;

    res.json({
      total,
      lowStock,
      outOfStock
    });

  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch product statistics'
    });
  }
};

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getCategories
};