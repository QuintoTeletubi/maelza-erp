const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get all suppliers with pagination, search and filters
 */
const getSuppliers = async (req, res) => {
  try {
    // Súper simple - solo traer todos los proveedores
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      suppliers,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: suppliers.length
      }
    });

  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch suppliers'
    });
  }
};

/**
 * Get supplier by ID
 */
const getSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      return res.status(404).json({
        error: 'Supplier not found'
      });
    }

    res.json({ supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const createSupplier = async (req, res) => {
  try {
    console.log('📦 Creating supplier - Request body:', req.body);

    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      contactPerson,
      contactPhone,
      taxId,
      notes
    } = req.body;

    console.log('📦 Extracted fields:', { name, email, phone });

    // Validate required fields
    if (!name) {
      console.log('❌ Validation failed - name required');
      return res.status(400).json({
        error: 'Validation error',
        message: 'Supplier name is required'
      });
    }

    console.log('📦 Creating supplier in database...');

    // Create supplier - ULTRA SIMPLE
    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        country: country ? country.trim() : null,
        contactPerson: contactPerson ? contactPerson.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : null,
        taxId: taxId ? taxId.trim() : null,
        notes: notes ? notes.trim() : null,
        isActive: true
      }
    });

    console.log('✅ Supplier created successfully:', supplier.id);

    res.status(201).json({
      message: 'Supplier created successfully',
      supplier
    });

  } catch (error) {
    console.error('❌ Create supplier error DETAILS:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};

/**
 * Update supplier
 */
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      city,
      country,
      contactPerson,
      contactPhone,
      taxId,
      notes,
      isActive
    } = req.body;

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return res.status(404).json({
        error: 'Supplier not found',
        message: `Supplier with ID ${id} not found`
      });
    }

    // Check if name already exists for another supplier
    if (name && name.trim().toLowerCase() !== existingSupplier.name.toLowerCase()) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: { 
          name: name.trim(),
          id: { not: id }
        }
      });

      if (duplicateSupplier) {
        return res.status(409).json({
          error: 'Name already exists',
          message: 'Another supplier already has this name'
        });
      }
    }

    // Check if email already exists for another supplier
    if (email && email.trim().toLowerCase() !== (existingSupplier.email || '').toLowerCase()) {
      const duplicateEmail = await prisma.supplier.findFirst({
        where: { 
          email: email.trim(),
          id: { not: id }
        }
      });

      if (duplicateEmail) {
        return res.status(409).json({
          error: 'Email already exists',
          message: 'Another supplier already has this email'
        });
      }
    }

    // Update supplier
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
        ...(city !== undefined && { city: city ? city.trim() : null }),
        ...(country !== undefined && { country: country ? country.trim() : null }),
        ...(contactPerson !== undefined && { contactPerson: contactPerson ? contactPerson.trim() : null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone ? contactPhone.trim() : null }),
        ...(taxId !== undefined && { taxId: taxId ? taxId.trim() : null }),
        ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier
    });

  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update supplier'
    });
  }
};

/**
 * Delete supplier (soft delete)
 */
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Simple soft delete
    await prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      message: 'Supplier deleted successfully'
    });

  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

/**
 * Get supplier statistics
 */
const getSupplierStats = async (req, res) => {
  try {
    // Total suppliers
    const total = await prisma.supplier.count({
      where: { isActive: true }
    });

    // Active suppliers (simplificado)
    const active = total; // Por ahora todos los activos

    // Inactive suppliers
    const inactive = await prisma.supplier.count({
      where: { isActive: false }
    });

    res.json({
      total,
      active,
      inactive
    });

  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch supplier statistics'
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierStats
};