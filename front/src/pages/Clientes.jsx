import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  UsersIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid, XCircleIcon as XCircleSolid } from '@heroicons/react/24/solid';
import customerService from '../services/customer.service';
import Loading from '../components/common/Loading';
import Modal from '../components/modals/Modal';
import CustomerForm from '../components/forms/CustomerForm';

const Clientes = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Load customers
  const loadCustomers = async (page = 1, searchTerm = search, filterActive = filter) => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page,
        limit: 10,
        search: searchTerm
      };

      if (filterActive === 'active') params.isActive = true;
      if (filterActive === 'inactive') params.isActive = false;

      const response = await customerService.getCustomers(params);
      
      setCustomers(response.customers);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading customers:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers(1, search, filter);
  };

  // Handle search input change with debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    
    // Auto-search after user stops typing for 500ms
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      loadCustomers(1, value, filter);
    }, 500);
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    loadCustomers(1, search, newFilter);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    loadCustomers(newPage, search, filter);
  };

  // Handle delete customer
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al cliente "${customerName}"?`)) {
      return;
    }

    try {
      await customerService.deleteCustomer(customerId);
      // Reload customers
      loadCustomers(pagination.currentPage, search, filter);
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(`Error al eliminar cliente: ${error.message}`);
    }
  };

  // Handle modal operations
  const openCreateModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleModalSuccess = () => {
    closeModal();
    // Reload customers
    loadCustomers(pagination.currentPage, search, filter);
  };

  if (loading && customers.length === 0) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Gestión de Clientes</h1>
                  <p className="text-blue-100 text-lg">Administra tu cartera de clientes de manera eficiente</p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-3 px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-lg rounded-2xl font-bold transition-all duration-300 hover:scale-105 border border-white/30"
              >
                <UserPlusIcon className="h-6 w-6" />
                <span>Nuevo Cliente</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium mb-2">Total Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{pagination.totalItems}</p>
              <p className="text-xs text-gray-500">En tu cartera</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <UsersIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-green-50 rounded-3xl p-6 border border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-2">Clientes Activos</p>
              <p className="text-3xl font-bold text-green-800 mb-1">
                {customers.filter(c => c.isActive).length}
              </p>
              <p className="text-xs text-green-600">Comprando regularmente</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-red-50 rounded-3xl p-6 border border-red-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium mb-2">Clientes Inactivos</p>
              <p className="text-3xl font-bold text-red-800 mb-1">
                {customers.filter(c => !c.isActive).length}
              </p>
              <p className="text-xs text-red-600">Requieren atención</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <XCircleIcon className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header with search and filters */}
        <div className="bg-gradient-to-r from-gray-50 to-white p-8 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Lista de Clientes</h2>
              <p className="text-gray-600">Gestiona y visualiza todos tus clientes</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por nombre, email, teléfono..."
                    value={search}
                    onChange={handleSearchInputChange}
                    className="w-80 pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 shadow-sm text-gray-700"
                  />
                  <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="ml-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Buscar
                </button>
              </form>

              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="appearance-none px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300 shadow-sm text-gray-700 font-medium cursor-pointer pr-10"
                  >
                    <option value="all">🔄 Todos los clientes</option>
                    <option value="active">✅ Solo activos</option>
                    <option value="inactive">❌ Solo inactivos</option>
                  </select>
                  <FunnelIcon className="absolute right-3 top-4 h-6 w-6 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Add Button - Mobile */}
              <div className="md:hidden">
                <button 
                  onClick={openCreateModal}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <UserPlusIcon className="h-6 w-6" />
                  Nuevo Cliente
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mb-6 p-6 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚠</span>
              </div>
              <div>
                <h3 className="font-bold text-red-800 mb-1">Error al cargar los datos</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          {customers.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mx-auto mb-8">
                <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-16 w-16 text-gray-400" />
                </div>
                <div className="absolute -top-2 -right-4 w-8 h-8 bg-blue-500 rounded-full animate-pulse flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-700 mb-3">
                {search ? '🔍 Sin resultados' : '👥 Base de clientes vacía'}
              </h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                {search 
                  ? 'No encontramos clientes que coincidan con tu búsqueda. Intenta con otros términos.' 
                  : 'Comienza construyendo tu cartera de clientes. El primer paso hacia el crecimiento de tu negocio.'}
              </p>
              <div className="space-y-4">
                <button 
                  onClick={openCreateModal}
                  className="flex items-center gap-3 mx-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <UserPlusIcon className="h-6 w-6" />
                  <span>{search ? 'Crear nuevo cliente' : 'Agregar primer cliente'}</span>
                </button>
                {search && (
                  <button 
                    onClick={() => {
                      setSearch('');
                      loadCustomers(1, '', filter);
                    }}
                    className="block mx-auto px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                  >
                    🔄 Limpiar búsqueda
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {customers.map((customer) => (
                <div key={customer.id} className="group bg-gradient-to-r from-white via-gray-50 to-white p-6 rounded-3xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Customer Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-xl font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                          {customer.isActive ? (
                            <CheckCircleSolid className="w-6 h-6 text-green-500" />
                          ) : (
                            <XCircleSolid className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{customer.name}</h3>
                        <p className="text-gray-600 text-sm">Cliente #{customer.id}</p>
                        <div className="flex items-center gap-4 mt-2">
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <EnvelopeIcon className="h-4 w-4 text-blue-600" />
                              <span className="text-gray-700 text-sm">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-green-600" />
                              <span className="text-gray-700 text-sm">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        className="p-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => openEditModal(customer)}
                        className="p-3 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors shadow-md hover:shadow-lg"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase">Información Fiscal</h4>
                      <p className="text-sm text-gray-700">RUC/Cédula: <span className="font-medium">{customer.taxId || 'N/A'}</span></p>
                      <p className="text-sm text-gray-700">Límite: <span className="font-bold text-green-600">S/ {parseFloat(customer.creditLimit || 0).toFixed(2)}</span></p>
                      <p className="text-sm text-gray-700">Deuda: <span className="font-bold text-red-600">S/ {parseFloat(customer.currentDebt || 0).toFixed(2)}</span></p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase">Ubicación</h4>
                      {customer.address ? (
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                          <span className="text-sm text-gray-700">{customer.address}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Sin dirección registrada</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase">Estado</h4>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        customer.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {customer.isActive ? (
                          <>
                            <CheckCircleIcon className="h-4 w-4 mr-2" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-4 w-4 mr-2" />
                            Inactivo
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Registro: {new Date(customer.createdAt).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
                      📄 Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} clientes
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg font-medium disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>
                      
                      <span className="px-3 py-2 bg-blue-600 text-white rounded-lg font-bold">
                        {pagination.currentPage} de {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 disabled:text-gray-400 rounded-lg font-medium disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {loading && customers.length > 0 && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <Loading />
              <p className="mt-3 text-gray-600 text-center">Cargando...</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCustomer ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}
        size="lg"
      >
        <CustomerForm
          customer={editingCustomer}
          onSuccess={handleModalSuccess}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  );
};

export default Clientes;