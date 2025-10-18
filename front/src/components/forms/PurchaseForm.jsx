/**
 * MAELZA ERP - Purchase Form Component
 * Formulario para crear y editar compras
 */

import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import supplierService from '../../services/supplier.service';
import productService from '../../services/product.service';
import { validatePurchase, calculatePurchaseTotals, formatCurrency } from '../../services/purchase.service';

const PurchaseForm = ({ 
  purchase = null, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [formData, setFormData] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    subtotal: 0,
    tax: 0,
    total: 0,
    status: 'PENDING',
    notes: '',
    items: [
      {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        subtotal: 0
      }
    ]
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [errors, setErrors] = useState({});
  const [loadingData, setLoadingData] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (purchase) {
      setFormData({
        supplierId: purchase.supplierId || '',
        date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        subtotal: purchase.subtotal || 0,
        tax: purchase.tax || 0,
        total: purchase.total || 0,
        status: purchase.status || 'PENDING',
        notes: purchase.notes || '',
        items: purchase.items?.length > 0 ? purchase.items.map(item => ({
          productId: item.productId || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          subtotal: item.subtotal || 0
        })) : [{
          productId: '',
          quantity: 1,
          unitPrice: 0,
          subtotal: 0
        }]
      });
    }
  }, [purchase]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      const [suppliersResponse, productsResponse] = await Promise.all([
        supplierService.getSuppliers({ limit: 1000 }),
        productService.getProducts({ limit: 1000 })
      ]);

      setSuppliers(suppliersResponse.suppliers || []);
      setProducts(productsResponse.products || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  const calculateTotals = () => {
    const totals = calculatePurchaseTotals(formData.items);
    setFormData(prev => ({
      ...prev,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
    }));
  };

  const calculateItemSubtotal = (quantity, unitPrice) => {
    return parseFloat((quantity * unitPrice).toFixed(2));
  };

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    try {
      const updatedItems = [...formData.items];
      
      // Validar y procesar el valor según el campo
      let processedValue = value;
      
      if (field === 'quantity') {
        // Solo permitir números positivos para cantidad
        processedValue = Math.max(0, parseFloat(value) || 0);
      } else if (field === 'unitPrice') {
        // Solo permitir números positivos para precio
        processedValue = Math.max(0, parseFloat(value) || 0);
      }
      
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: processedValue
      };

      // Recalcular subtotal solo si los valores son válidos
      if (field === 'quantity' || field === 'unitPrice') {
        const quantity = updatedItems[index].quantity || 0;
        const unitPrice = updatedItems[index].unitPrice || 0;
        
        if (quantity >= 0 && unitPrice >= 0) {
          updatedItems[index].subtotal = calculateItemSubtotal(quantity, unitPrice);
        } else {
          updatedItems[index].subtotal = 0;
        }
      }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));

    // Clear item errors
    const errorKey = `items.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
    } catch (error) {
      console.error('Error updating item:', error);
      // No hacer nada si hay error, mantener valores anteriores
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          quantity: 1,
          unitPrice: 0,
          subtotal: 0
        }
      ]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validar que hay al menos un proveedor y productos disponibles
      if (suppliers.length === 0) {
        alert('No hay proveedores disponibles. Por favor, cree al menos un proveedor primero.');
        return;
      }

      if (products.length === 0) {
        alert('No hay productos disponibles. Por favor, cree al menos un producto primero.');
        return;
      }

      // Validar datos del formulario
      const validation = validatePurchase(formData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        
        // Mostrar el primer error encontrado
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
          alert(`Error de validación: ${firstError}`);
        }
        return;
      }

      // Validar que los totales son correctos
      if (formData.total <= 0) {
        alert('El total de la compra debe ser mayor a 0');
        return;
      }

      // Clear errors and submit
      setErrors({});
      await onSubmit(formData);
      
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      alert('Error al guardar la compra: ' + (error.message || 'Error desconocido'));
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getProductName = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    return product ? product.name : 'Seleccionar producto';
  };

  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find(s => s.id === parseInt(supplierId));
    return supplier ? supplier.name : 'Seleccionar proveedor';
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Cargando datos...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proveedor *
          </label>
          <select
            name="supplierId"
            value={formData.supplierId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.supplierId ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Seleccionar proveedor</option>
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
          {errors.supplierId && (
            <p className="text-red-500 text-xs mt-1">{errors.supplierId}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha *
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pendiente</option>
            <option value="RECEIVED">Recibida</option>
            <option value="PARTIAL">Parcial</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Items Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Artículos</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Agregar Artículo
          </Button>
        </div>

        {errors.items && (
          <p className="text-red-500 text-sm mb-4">{errors.items}</p>
        )}

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Product */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.productId`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                  {errors[`items.${index}.productId`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.productId`]}</p>
                  )}
                </div>

                {/* Quantity */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.quantity`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors[`items.${index}.quantity`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.quantity`]}</p>
                  )}
                </div>

                {/* Unit Price */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unit. *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[`items.${index}.unitPrice`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors[`items.${index}.unitPrice`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`items.${index}.unitPrice`]}</p>
                  )}
                </div>

                {/* Subtotal */}
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="md:col-span-1">
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IGV (18%):</span>
            <span className="font-medium">{formatCurrency(formData.tax)}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-semibold text-blue-600">{formatCurrency(formData.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notas
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Observaciones adicionales..."
        />
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {purchase ? 'Actualizar' : 'Crear'} Compra
        </Button>
      </div>
    </form>
  );
};

export default PurchaseForm;