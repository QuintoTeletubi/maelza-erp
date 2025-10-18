import React, { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Button from '../common/Button'
import customerService from '../../services/customer.service'
import productService from '../../services/product.service'
import saleService from '../../services/sale.service'

const SaleForm = ({ sale, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'pending',
    items: [{ productId: '', quantity: 1, unitPrice: '' }]
  })
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Cargar datos del sale si estamos editando
  useEffect(() => {
    if (sale) {
      setFormData({
        customerId: sale.customerId || '',
        date: sale.date ? new Date(sale.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: sale.notes || '',
        status: sale.status || 'pending',
        items: sale.items && sale.items.length > 0 
          ? sale.items.map(item => ({
              productId: item.productId || '',
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || ''
            }))
          : [{ productId: '', quantity: 1, unitPrice: '' }]
      })
    }
  }, [sale])

  const loadInitialData = async () => {
    try {
      setLoadingData(true)
      const [customersData, productsData] = await Promise.all([
        customerService.getCustomers({ limit: 1000 }),
        productService.getProducts({ limit: 1000 })
      ])
      
      console.log('Customers loaded:', customersData)
      console.log('Products loaded:', productsData)
      
      setCustomers(customersData.customers || [])
      setProducts(productsData.products || [])
    } catch (error) {
      console.error('Error loading initial data:', error)
      setErrors({ general: 'Error al cargar los datos iniciales' })
    } finally {
      setLoadingData(false)
    }
  }

  const handleChange = (e) => {
    try {
      const { name, value } = e.target
      
      // Validaciones en tiempo real para campos específicos
      let processedValue = value
      
      switch (name) {
        case 'notes':
          // Limitar longitud de notas
          if (value.length > 500) {
            return
          }
          break
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }))
      
      // Limpiar error del campo cuando el usuario empiece a escribir
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }))
      }
    } catch (error) {
      console.error('Error en handleChange:', error)
    }
  }

  const handleItemChange = (index, field, value) => {
    try {
      // Validaciones en tiempo real para campos de items
      let processedValue = value
      
      switch (field) {
        case 'quantity':
          // Solo permitir números enteros positivos
          if (value && !/^\d*$/.test(value)) {
            return
          }
          if (value && parseInt(value) > 10000) {
            return // Limitar cantidad máxima
          }
          processedValue = value === '' ? '' : parseInt(value)
          break
        case 'unitPrice':
          // Solo permitir números y punto decimal
          if (value && !/^\d*\.?\d*$/.test(value)) {
            return
          }
          if (value && parseFloat(value) > 999999.99) {
            return // Limitar precio máximo
          }
          break
      }
      
      setFormData(prev => {
        const newItems = [...prev.items]
        newItems[index] = { 
          ...newItems[index], 
          [field]: processedValue 
        }
        
        // Si cambió el producto, actualizar el precio automáticamente
        if (field === 'productId' && processedValue) {
          const selectedProduct = products.find(p => p.id === processedValue)
          if (selectedProduct) {
            newItems[index].unitPrice = selectedProduct.salePrice || ''
          }
        }
        
        return {
          ...prev,
          items: newItems
        }
      })
      
      // Limpiar errores relacionados con este item
      const errorKey = `item_${index}_${field}`
      if (errors[errorKey]) {
        setErrors(prev => ({
          ...prev,
          [errorKey]: ''
        }))
      }
    } catch (error) {
      console.error('Error en handleItemChange:', error)
    }
  }

  const addItem = () => {
    try {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { productId: '', quantity: 1, unitPrice: '' }]
      }))
    } catch (error) {
      console.error('Error en addItem:', error)
    }
  }

  const removeItem = (index) => {
    try {
      if (formData.items.length > 1) {
        setFormData(prev => ({
          ...prev,
          items: prev.items.filter((_, i) => i !== index)
        }))
        
        // Limpiar errores de este item
        setErrors(prev => {
          const newErrors = { ...prev }
          Object.keys(newErrors).forEach(key => {
            if (key.startsWith(`item_${index}_`)) {
              delete newErrors[key]
            }
          })
          return newErrors
        })
      }
    } catch (error) {
      console.error('Error en removeItem:', error)
    }
  }

  const validateForm = () => {
    try {
      const newErrors = {}

      // Validación de cliente
      if (!formData.customerId || !formData.customerId.toString().trim()) {
        newErrors.customerId = 'El cliente es requerido'
      }

      // Validación de fecha
      if (!formData.date) {
        newErrors.date = 'La fecha es requerida'
      } else {
        const selectedDate = new Date(formData.date)
        const today = new Date()
        if (selectedDate > today) {
          newErrors.date = 'La fecha no puede ser futura'
        }
      }

      // Validación de estado
      if (!formData.status) {
        newErrors.status = 'El estado es requerido'
      }

      // Validación de items
      if (!formData.items || formData.items.length === 0) {
        newErrors.items = 'Al menos un producto es requerido'
      } else {
        let hasValidItem = false
        formData.items.forEach((item, index) => {
          // Validar producto
          if (!item.productId || !item.productId.toString().trim()) {
            newErrors[`item_${index}_product`] = 'Producto requerido'
          }
          
          // Validar cantidad
          const quantity = parseInt(item.quantity)
          if (!item.quantity || quantity <= 0) {
            newErrors[`item_${index}_quantity`] = 'Cantidad debe ser mayor a 0'
          } else if (quantity > 10000) {
            newErrors[`item_${index}_quantity`] = 'Cantidad muy alta'
          }
          
          // Validar precio unitario
          const unitPrice = parseFloat(item.unitPrice)
          if (item.unitPrice === '' || isNaN(unitPrice) || unitPrice < 0) {
            newErrors[`item_${index}_price`] = 'Precio unitario requerido'
          } else if (unitPrice > 999999.99) {
            newErrors[`item_${index}_price`] = 'Precio muy alto'
          }

          // Validar stock disponible
          if (item.productId && item.quantity) {
            const product = products.find(p => p.id === item.productId)
            if (product && product.stock < quantity) {
              newErrors[`item_${index}_stock`] = `Stock insuficiente (disponible: ${product.stock})`
            }
          }
          
          if (item.productId && item.quantity && !isNaN(unitPrice)) {
            hasValidItem = true
          }
        })
        
        if (!hasValidItem) {
          newErrors.items = 'Al menos un producto válido es requerido'
        }
      }

      // Validación de notas (opcional)
      if (formData.notes && formData.notes.toString().trim().length > 500) {
        newErrors.notes = 'Las notas no pueden tener más de 500 caracteres'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    } catch (error) {
      console.error('Error en validateForm:', error)
      setErrors({ general: 'Error al validar el formulario. Por favor, revise los datos ingresados.' })
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Limpiar errores previos
      setErrors({})
      
      if (!validateForm()) {
        console.log('Validación fallida, errores:', errors)
        return
      }

      setIsSubmitting(true)
      
      // Validación adicional de seguridad antes del envío
      if (!formData.customerId || !formData.items.length) {
        setErrors({ general: 'Cliente y productos son obligatorios' })
        return
      }
      
      // Preparar datos para enviar con validaciones adicionales
      const saleData = {
        customerId: formData.customerId.toString(),
        date: formData.date,
        notes: formData.notes && formData.notes.toString().trim() ? formData.notes.toString().trim() : null,
        status: formData.status,
        items: formData.items.map(item => ({
          productId: item.productId.toString(),
          quantity: parseInt(item.quantity),
          unitPrice: Math.round(parseFloat(item.unitPrice) * 100) / 100 // Redondear a 2 decimales
        }))
      }

      // Validación final de los datos procesados
      for (const item of saleData.items) {
        if (!item.productId || isNaN(item.quantity) || item.quantity <= 0 || isNaN(item.unitPrice) || item.unitPrice < 0) {
          setErrors({ general: 'Datos de productos inválidos' })
          return
        }
      }

      console.log('Sending sale data:', saleData)
      
      await onSave(saleData)
      
    } catch (error) {
      console.error('Error saving sale:', error)
      setErrors({ 
        general: 'Error al guardar la venta. Por favor, revise los datos e intente nuevamente.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular totales
  const calculateTotals = () => {
    try {
      const subtotal = formData.items.reduce((sum, item) => {
        const quantity = parseInt(item.quantity) || 0
        const unitPrice = parseFloat(item.unitPrice) || 0
        return sum + (quantity * unitPrice)
      }, 0)
      
      const tax = subtotal * 0.18 // 18% IGV
      const total = subtotal + tax
      
      return { subtotal, tax, total }
    } catch (error) {
      console.error('Error calculating totals:', error)
      return { subtotal: 0, tax: 0, total: 0 }
    }
  }

  const { subtotal, tax, total } = calculateTotals()

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando datos...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error general */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-2">
            Cliente *
          </label>
          <select
            id="customerId"
            name="customerId"
            value={formData.customerId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.customerId ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccionar cliente</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} {customer.taxId ? `(${customer.taxId})` : ''}
              </option>
            ))}
          </select>
          {errors.customerId && <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>}
        </div>

        {/* Estado */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.status ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="pending">Pendiente</option>
            <option value="completed">Completada</option>
          </select>
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fecha */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
        </div>
      </div>

      {/* Productos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Productos *
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addItem}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Agregar Producto
          </Button>
        </div>

        {errors.items && (
          <p className="mb-3 text-sm text-red-600">{errors.items}</p>
        )}

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Producto */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Producto *
                  </label>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`item_${index}_product`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Seleccionar producto</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code}) - Stock: {product.stock}
                      </option>
                    ))}
                  </select>
                  {errors[`item_${index}_product`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_product`]}</p>
                  )}
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`item_${index}_quantity`] || errors[`item_${index}_stock`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                  />
                  {errors[`item_${index}_quantity`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_quantity`]}</p>
                  )}
                  {errors[`item_${index}_stock`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_stock`]}</p>
                  )}
                </div>

                {/* Precio Unitario */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Precio Unit. *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors[`item_${index}_price`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                  {errors[`item_${index}_price`] && (
                    <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_price`]}</p>
                  )}
                </div>
              </div>

              {/* Total del item y botón eliminar */}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Total: </span>
                  <span className="font-semibold">
                    S/ {((parseInt(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)).toFixed(2)}
                  </span>
                </div>
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="flex items-center text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totales */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Resumen de la Venta</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>IGV (18%):</span>
            <span>S/ {tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-blue-200 pt-2">
            <span>Total:</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notas Adicionales
        </label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          maxLength={500}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Observaciones adicionales sobre la venta..."
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes}</p>}
        <p className="mt-1 text-xs text-gray-500">
          {formData.notes ? formData.notes.length : 0}/500 caracteres
        </p>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting || loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSubmitting || loading}
          disabled={isSubmitting || loading}
        >
          {sale ? 'Actualizar' : 'Crear'} Venta
        </Button>
      </div>
    </form>
  )
}

export default SaleForm