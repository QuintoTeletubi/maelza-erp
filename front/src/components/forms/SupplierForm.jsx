import React, { useState, useEffect } from 'react'
import Button from '../common/Button'
import SupplierService from '../../services/supplier.service'

const SupplierForm = ({ supplier, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    contactPerson: '',
    contactPhone: '',
    taxId: '',
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar datos del proveedor si estamos editando
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || '',
        contactPerson: supplier.contactPerson || '',
        contactPhone: supplier.contactPhone || '',
        taxId: supplier.taxId || '',
        notes: supplier.notes || ''
      })
    }
  }, [supplier])

  const handleChange = (e) => {
    try {
      const { name, value } = e.target
      
      // Validaciones en tiempo real para campos específicos
      let processedValue = value
      
      switch (name) {
        case 'phone':
        case 'contactPhone':
          // Solo permitir números, espacios, guiones y paréntesis para teléfonos
          if (value && !/^[\+\d\s\-\(\)]*$/.test(value)) {
            return // No actualizar si contiene caracteres no válidos
          }
          if (value.length > 20) {
            return // Limitar longitud del teléfono
          }
          break
        case 'email':
          // Limitar longitud del email
          if (value.length > 100) {
            return
          }
          break
        case 'name':
        case 'contactPerson':
        case 'city':
        case 'country':
          // Limitar longitud de campos de texto
          if (value.length > 100) {
            return
          }
          break
        case 'address':
          // Limitar longitud de dirección
          if (value.length > 200) {
            return
          }
          break
        case 'taxId':
          // Solo permitir números, guiones y caracteres alfanuméricos para RUC/NIT
          if (value && !/^[\w\-]*$/.test(value)) {
            return
          }
          if (value.length > 20) {
            return
          }
          break
        case 'notes':
          // Limitar longitud de notas
          if (value.length > 1000) {
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

      // Validación de nombre
      if (!formData.name || !formData.name.toString().trim()) {
        newErrors.name = 'El nombre del proveedor es requerido'
      } else if (formData.name.toString().trim().length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres'
      } else if (formData.name.toString().trim().length > 100) {
        newErrors.name = 'El nombre no puede tener más de 100 caracteres'
      }

      // Validación de email (opcional pero si se ingresa debe ser válido)
      if (formData.email && formData.email.toString().trim()) {
        if (!isValidEmail(formData.email.toString().trim())) {
          newErrors.email = 'Formato de email inválido'
        } else if (formData.email.toString().trim().length > 100) {
          newErrors.email = 'El email no puede tener más de 100 caracteres'
        }
      }

      // Validación de teléfono principal (opcional pero si se ingresa debe ser válido)
      if (formData.phone && formData.phone.toString().trim()) {
        if (!isValidPhone(formData.phone.toString().trim())) {
          newErrors.phone = 'Formato de teléfono inválido (ej: +57 300 123 4567)'
        }
      }

      // Validación de teléfono de contacto (opcional)
      if (formData.contactPhone && formData.contactPhone.toString().trim()) {
        if (!isValidPhone(formData.contactPhone.toString().trim())) {
          newErrors.contactPhone = 'Formato de teléfono de contacto inválido'
        }
      }

      // Validación de RUC/Tax ID (opcional)
      if (formData.taxId && formData.taxId.toString().trim()) {
        if (formData.taxId.toString().trim().length < 3) {
          newErrors.taxId = 'El RUC/NIT debe tener al menos 3 caracteres'
        } else if (formData.taxId.toString().trim().length > 20) {
          newErrors.taxId = 'El RUC/NIT no puede tener más de 20 caracteres'
        }
      }

      // Validación de persona de contacto (opcional)
      if (formData.contactPerson && formData.contactPerson.toString().trim().length > 100) {
        newErrors.contactPerson = 'El nombre de contacto no puede tener más de 100 caracteres'
      }

      // Validación de ciudad (opcional)
      if (formData.city && formData.city.toString().trim().length > 100) {
        newErrors.city = 'El nombre de la ciudad no puede tener más de 100 caracteres'
      }

      // Validación de país (opcional)
      if (formData.country && formData.country.toString().trim().length > 100) {
        newErrors.country = 'El nombre del país no puede tener más de 100 caracteres'
      }

      // Validación de dirección (opcional)
      if (formData.address && formData.address.toString().trim().length > 200) {
        newErrors.address = 'La dirección no puede tener más de 200 caracteres'
      }

      // Validación de notas (opcional)
      if (formData.notes && formData.notes.toString().trim().length > 1000) {
        newErrors.notes = 'Las notas no pueden tener más de 1000 caracteres'
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    } catch (error) {
      console.error('Error en validateForm:', error)
      setErrors({ general: 'Error al validar el formulario. Por favor, revise los datos ingresados.' })
      return false
    }
  }

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/
    return phoneRegex.test(phone)
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
      if (!formData.name || !formData.name.toString().trim()) {
        setErrors({ name: 'El nombre del proveedor es obligatorio' })
        return
      }
      
      // Preparar datos para enviar con validaciones adicionales
      const supplierData = {
        name: formData.name.toString().trim(),
        email: formData.email && formData.email.toString().trim() ? formData.email.toString().trim() : null,
        phone: formData.phone && formData.phone.toString().trim() ? formData.phone.toString().trim() : null,
        address: formData.address && formData.address.toString().trim() ? formData.address.toString().trim() : null,
        city: formData.city && formData.city.toString().trim() ? formData.city.toString().trim() : null,
        country: formData.country && formData.country.toString().trim() ? formData.country.toString().trim() : null,
        contactPerson: formData.contactPerson && formData.contactPerson.toString().trim() ? formData.contactPerson.toString().trim() : null,
        contactPhone: formData.contactPhone && formData.contactPhone.toString().trim() ? formData.contactPhone.toString().trim() : null,
        taxId: formData.taxId && formData.taxId.toString().trim() ? formData.taxId.toString().trim() : null,
        notes: formData.notes && formData.notes.toString().trim() ? formData.notes.toString().trim() : null
      }

      // Validación final de email si se proporcionó
      if (supplierData.email && !isValidEmail(supplierData.email)) {
        setErrors({ email: 'Formato de email inválido' })
        return
      }

      // Validación final de teléfonos si se proporcionaron
      if (supplierData.phone && !isValidPhone(supplierData.phone)) {
        setErrors({ phone: 'Formato de teléfono inválido' })
        return
      }

      if (supplierData.contactPhone && !isValidPhone(supplierData.contactPhone)) {
        setErrors({ contactPhone: 'Formato de teléfono de contacto inválido' })
        return
      }

      console.log('Sending supplier data:', supplierData)
      await onSave(supplierData)
      
    } catch (error) {
      console.error('Error saving supplier:', error)
      setErrors({ 
        general: 'Error al guardar el proveedor. Por favor, revise los datos e intente nuevamente.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Proveedor *
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
            placeholder="Razón social o nombre comercial"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* RUC/Tax ID */}
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
            RUC / NIT
          </label>
          <input
            type="text"
            id="taxId"
            name="taxId"
            value={formData.taxId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="123456789-1"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="contacto@proveedor.com"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teléfono Principal */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono Principal
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+57 300 123 4567"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        {/* Persona de Contacto */}
        <div>
          <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-2">
            Persona de Contacto
          </label>
          <input
            type="text"
            id="contactPerson"
            name="contactPerson"
            value={formData.contactPerson}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Juan Pérez"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teléfono de Contacto */}
        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono de Contacto
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+57 300 987 6543"
          />
        </div>

        {/* Ciudad */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Medellín"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* País */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            País
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Colombia"
          />
        </div>

        {/* Dirección */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Calle 123 #45-67"
          />
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
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Información adicional sobre el proveedor, términos de pago, productos que suministra, etc."
        />
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
          {supplier ? 'Actualizar' : 'Crear'} Proveedor
        </Button>
      </div>
    </form>
  )
}

export default SupplierForm