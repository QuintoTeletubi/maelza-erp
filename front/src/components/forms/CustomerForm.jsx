import React, { useState } from 'react';
import customerService from '../../services/customer.service';

const CustomerForm = ({ 
  customer = null, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    taxId: customer?.taxId || '',
    creditLimit: customer?.creditLimit || 0,
    isActive: customer?.isActive !== undefined ? customer.isActive : true
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditMode = customer !== null;

  const handleInputChange = (e) => {
    try {
      const { name, value, type, checked } = e.target;
      
      // Validaciones en tiempo real para campos específicos
      let processedValue = type === 'checkbox' ? checked : value;
      
      if (type !== 'checkbox') {
        switch (name) {
          case 'creditLimit':
            // Solo permitir números y punto decimal para límite de crédito
            if (value && !/^\d*\.?\d*$/.test(value)) {
              return; // No actualizar si no es un número válido
            }
            // Convertir a número para validación de rango
            const creditNum = parseFloat(value);
            if (value && (creditNum < 0 || creditNum > 999999999)) {
              return; // No permitir valores negativos o muy grandes
            }
            break;
          case 'phone':
            // Permitir solo números, espacios, guiones y paréntesis para teléfonos
            if (value && !/^[\+\d\s\-\(\)]*$/.test(value)) {
              return;
            }
            if (value.length > 20) {
              return; // Limitar longitud del teléfono
            }
            break;
          case 'email':
            // Limitar longitud del email
            if (value.length > 100) {
              return;
            }
            break;
          case 'name':
            // Limitar longitud del nombre
            if (value.length > 100) {
              return;
            }
            break;
          case 'taxId':
            // Solo permitir números, letras y guiones para RUC/Cédula
            if (value && !/^[\w\-]*$/.test(value)) {
              return;
            }
            if (value.length > 20) {
              return;
            }
            break;
          case 'address':
            // Limitar longitud de dirección
            if (value.length > 300) {
              return;
            }
            break;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    } catch (error) {
      console.error('Error en handleInputChange:', error);
    }
  };

  const validateForm = () => {
    try {
      const newErrors = {};

      // Validación de nombre
      if (!formData.name || !formData.name.toString().trim()) {
        newErrors.name = 'El nombre es requerido';
      } else if (formData.name.toString().trim().length < 2) {
        newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      } else if (formData.name.toString().trim().length > 100) {
        newErrors.name = 'El nombre no puede tener más de 100 caracteres';
      }

      // Validación de email (opcional pero si se ingresa debe ser válido)
      if (formData.email && formData.email.toString().trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.toString().trim())) {
          newErrors.email = 'Formato de email inválido';
        } else if (formData.email.toString().trim().length > 100) {
          newErrors.email = 'El email no puede tener más de 100 caracteres';
        }
      }

      // Validación de teléfono (opcional)
      if (formData.phone && formData.phone.toString().trim()) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
        if (!phoneRegex.test(formData.phone.toString().trim())) {
          newErrors.phone = 'Formato de teléfono inválido (ej: +57 300 123 4567)';
        }
      }

      // Validación de RUC/Cédula (opcional)
      if (formData.taxId && formData.taxId.toString().trim()) {
        if (formData.taxId.toString().trim().length < 3) {
          newErrors.taxId = 'El RUC/Cédula debe tener al menos 3 caracteres';
        } else if (formData.taxId.toString().trim().length > 20) {
          newErrors.taxId = 'El RUC/Cédula no puede tener más de 20 caracteres';
        }
      }

      // Validación de límite de crédito
      const creditLimit = parseFloat(formData.creditLimit);
      if (formData.creditLimit !== null && formData.creditLimit !== undefined && formData.creditLimit !== '') {
        if (isNaN(creditLimit) || creditLimit < 0) {
          newErrors.creditLimit = 'El límite de crédito debe ser un número mayor o igual a 0';
        } else if (creditLimit > 999999999) {
          newErrors.creditLimit = 'El límite de crédito no puede ser mayor a 999,999,999';
        }
      }

      // Validación de dirección (opcional)
      if (formData.address && formData.address.toString().trim().length > 300) {
        newErrors.address = 'La dirección no puede tener más de 300 caracteres';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error('Error en validateForm:', error);
      setErrors({ general: 'Error al validar el formulario. Por favor, revise los datos ingresados.' });
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Limpiar errores previos
      setErrors({});
      
      if (!validateForm()) {
        console.log('Validación fallida, errores:', errors);
        return;
      }

      setLoading(true);

      // Validación adicional de seguridad antes del envío
      if (!formData.name || !formData.name.toString().trim()) {
        setErrors({ name: 'El nombre del cliente es obligatorio' });
        return;
      }

      // Preparar datos para enviar con validaciones adicionales
      const customerData = {
        name: formData.name.toString().trim(),
        email: formData.email && formData.email.toString().trim() ? formData.email.toString().trim() : null,
        phone: formData.phone && formData.phone.toString().trim() ? formData.phone.toString().trim() : null,
        address: formData.address && formData.address.toString().trim() ? formData.address.toString().trim() : null,
        taxId: formData.taxId && formData.taxId.toString().trim() ? formData.taxId.toString().trim() : null,
        creditLimit: formData.creditLimit ? Math.round(parseFloat(formData.creditLimit) * 100) / 100 : 0, // Redondear a 2 decimales
        isActive: formData.isActive
      };

      // Validación final de email si se proporcionó
      if (customerData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerData.email)) {
          setErrors({ email: 'Formato de email inválido' });
          return;
        }
      }

      // Validación final de límite de crédito
      if (isNaN(customerData.creditLimit) || customerData.creditLimit < 0) {
        setErrors({ creditLimit: 'Límite de crédito inválido' });
        return;
      }

      console.log('Sending customer data:', customerData);

      if (isEditMode) {
        await customerService.updateCustomer(customer.id, customerData);
      } else {
        await customerService.createCustomer(customerData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle specific validation errors from backend
      if (error.message && (error.message.includes('Tax ID already exists') || error.message.includes('RUC'))) {
        setErrors({ taxId: 'Este RUC/Cédula ya existe' });
      } else if (error.message && error.message.includes('Email already exists')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        setErrors({ 
          submit: error.message || 'Error al guardar el cliente. Por favor, revise los datos e intente nuevamente.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* General error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nombre/Razón Social *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
            errors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Ingresa el nombre del cliente"
        />
        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Email and Phone in same row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="ejemplo@correo.com"
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="999-999-999"
          />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Tax ID and Credit Limit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-1">
            RUC/Cédula
          </label>
          <input
            type="text"
            id="taxId"
            name="taxId"
            value={formData.taxId}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.taxId ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="RUC o número de cédula"
          />
          {errors.taxId && <p className="text-red-600 text-xs mt-1">{errors.taxId}</p>}
        </div>

        <div>
          <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700 mb-1">
            Límite de Crédito (S/)
          </label>
          <input
            type="number"
            id="creditLimit"
            name="creditLimit"
            value={formData.creditLimit}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.creditLimit ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.creditLimit && <p className="text-red-600 text-xs mt-1">{errors.creditLimit}</p>}
        </div>
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          placeholder="Dirección completa del cliente"
        />
      </div>

      {/* Active status (only for edit mode) */}
      {isEditMode && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
            Cliente activo
          </label>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditMode ? 'Actualizando...' : 'Creando...'}
            </div>
          ) : (
            isEditMode ? 'Actualizar Cliente' : 'Crear Cliente'
          )}
        </button>
      </div>
    </form>
  );
};

export default CustomerForm;