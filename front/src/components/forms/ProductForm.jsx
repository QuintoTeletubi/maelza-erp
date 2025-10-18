import React, { useState, useEffect } from 'react'
import Button from '../common/Button'
import ProductService from '../../services/product.service'

const ProductForm = ({ product, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: 'UNIT'
  })
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories()
  }, [])

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        name: product.name || '',
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        minStock: product.minStock || '',
        unit: product.unit || 'UNIT'
      })
    }
  }, [product])

  const loadCategories = async () => {
    try {
      const data = await ProductService.getCategories()
      console.log('Categories loaded:', data)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleChange = (e) => {
    try {
      const { name, value } = e.target
      
      // Validaciones en tiempo real para campos específicos
      let processedValue = value
      
      switch (name) {
        case 'price':
        case 'cost':
        case 'stock':
        case 'minStock':
          // Solo permitir números y punto decimal
          if (value && !/^\d*\.?\d*$/.test(value)) {
            return // No actualizar si no es un número válido
          }
          break
        case 'code':
        case 'name':
          // Limitar longitud de campos de texto
          if (value.length > 100) {
            return
          }
          break
        case 'description':
          // Limitar longitud de descripción
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

  const validateForm = () => {
    try {
      const newErrors = {}

      // Validación de código
      if (!formData.code || !formData.code.toString().trim()) {
        newErrors.code = 'El código es requerido'
      } else if (formData.code.toString().trim().length < 2) {
        newErrors.code = 'El código debe tener al menos 2 caracteres'
      } else if (formData.code.toString().trim().length > 20) {
        newErrors.code = 'El código no puede tener más de 20 caracteres'
      }

      // Validación de nombre
      if (!formData.name || !formData.name.toString().trim()) {
        newErrors.name = 'El nombre es requerido'
      } else if (formData.name.toString().trim().length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres'
      } else if (formData.name.toString().trim().length > 100) {
        newErrors.name = 'El nombre no puede tener más de 100 caracteres'
      }

      // Validación de categoría
      if (!formData.categoryId || !formData.categoryId.toString().trim()) {
        newErrors.categoryId = 'La categoría es requerida'
      }

      // Validación de precio
      const price = parseFloat(formData.price)
      if (!formData.price || formData.price.toString().trim() === '') {
        newErrors.price = 'El precio es requerido'
      } else if (isNaN(price) || price <= 0) {
        newErrors.price = 'El precio debe ser un número mayor a 0'
      } else if (price > 999999.99) {
        newErrors.price = 'El precio no puede ser mayor a 999,999.99'
      }

      // Validación de costo (opcional)
      if (formData.cost && formData.cost.toString().trim() !== '') {
        const cost = parseFloat(formData.cost)
        if (isNaN(cost) || cost < 0) {
          newErrors.cost = 'El costo debe ser un número mayor o igual a 0'
        } else if (cost > 999999.99) {
          newErrors.cost = 'El costo no puede ser mayor a 999,999.99'
        }
      }

      // Validación de stock
      const stock = parseFloat(formData.stock)
      if (formData.stock === '' || formData.stock === null || formData.stock === undefined) {
        newErrors.stock = 'El stock es requerido'
      } else if (isNaN(stock) || stock < 0) {
        newErrors.stock = 'El stock debe ser un número mayor o igual a 0'
      } else if (stock > 999999) {
        newErrors.stock = 'El stock no puede ser mayor a 999,999'
      }

      // Validación de stock mínimo
      const minStock = parseFloat(formData.minStock)
      if (formData.minStock === '' || formData.minStock === null || formData.minStock === undefined) {
        newErrors.minStock = 'El stock mínimo es requerido'
      } else if (isNaN(minStock) || minStock < 0) {
        newErrors.minStock = 'El stock mínimo debe ser un número mayor o igual a 0'
      } else if (minStock > 999999) {
        newErrors.minStock = 'El stock mínimo no puede ser mayor a 999,999'
      }

      // Validación de descripción (opcional)
      if (formData.description && formData.description.toString().length > 500) {
        newErrors.description = 'La descripción no puede tener más de 500 caracteres'
      }

      // Validación de unidad
      if (!formData.unit || !formData.unit.toString().trim()) {
        newErrors.unit = 'La unidad es requerida'
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
      
      console.log('Form data before processing:', formData);
      
      // Validaciones adicionales de seguridad antes del envío
      if (!formData.code || !formData.name || !formData.categoryId || !formData.price) {
        setErrors({ general: 'Todos los campos obligatorios deben estar completos' })
        return
      }
      
      // Preparar datos para enviar con validaciones adicionales
      const productData = {
        code: formData.code.toString().trim(),
        name: formData.name.toString().trim(), 
        description: formData.description ? formData.description.toString().trim() : null,
        categoryId: formData.categoryId.toString(),
        salePrice: Math.round(parseFloat(formData.price) * 100) / 100, // Redondear a 2 decimales
        costPrice: formData.cost ? Math.round(parseFloat(formData.cost) * 100) / 100 : 0,
        stock: parseInt(formData.stock),
        minStock: parseInt(formData.minStock),
        unit: formData.unit.toString().trim()
      }

      // Validación final de los datos procesados
      if (isNaN(productData.salePrice) || productData.salePrice <= 0) {
        setErrors({ price: 'Precio inválido' })
        return
      }

      if (isNaN(productData.stock) || productData.stock < 0) {
        setErrors({ stock: 'Stock inválido' })
        return
      }

      if (isNaN(productData.minStock) || productData.minStock < 0) {
        setErrors({ minStock: 'Stock mínimo inválido' })
        return
      }

      console.log('Sending product data:', productData)
      console.log('Category ID check:', { 
        original: formData.categoryId, 
        parsed: productData.categoryId,
        isValid: !!productData.categoryId 
      })
      
      await onSave(productData)
      
    } catch (error) {
      console.error('Error saving product:', error)
      setErrors({ 
        general: 'Error al guardar el producto. Por favor, revise los datos e intente nuevamente.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const unitOptions = [
    { value: 'UNIT', label: 'Unidad' },
    { value: 'KG', label: 'Kilogramo' },
    { value: 'LB', label: 'Libra' },
    { value: 'L', label: 'Litro' },
    { value: 'ML', label: 'Mililitro' },
    { value: 'M', label: 'Metro' },
    { value: 'CM', label: 'Centímetro' },
    { value: 'PCS', label: 'Piezas' },
    { value: 'BOX', label: 'Caja' },
    { value: 'PACK', label: 'Paquete' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Código */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
            Código del Producto *
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.code ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="P001, SKU123, etc."
          />
          {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Producto *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nombre del producto"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Descripción del producto (opcional)"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categoría */}
        <div>
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <input
            type="text"
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ej: Materias Primas, Productos Terminados"
          />
          {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
        </div>

        {/* Unidad */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
            Unidad de Medida
          </label>
          <select
            id="unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {unitOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Precio de Venta */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Precio de Venta *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className={`w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>

        {/* Costo */}
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
            Costo (Opcional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Actual */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
            Stock Actual *
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.stock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
        </div>

        {/* Stock Mínimo */}
        <div>
          <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 mb-2">
            Stock Mínimo *
          </label>
          <input
            type="number"
            id="minStock"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.minStock ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
          />
          {errors.minStock && <p className="mt-1 text-sm text-red-600">{errors.minStock}</p>}
        </div>
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
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  )
}

export default ProductForm