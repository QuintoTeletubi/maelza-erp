import React, { useState, useEffect } from 'react'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import Button from '../components/common/Button'
import Modal from '../components/modals/Modal'
import Loading from '../components/common/Loading'
import SaleForm from '../components/forms/SaleForm'
import saleService from '../services/sale.service'

const Ventas = () => {
  // Estados principales
  const [sales, setSales] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estados de modales
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create', 'edit', 'view'
  const [selectedSale, setSelectedSale] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  
  // Estados de filtros y paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({})
  
  // Estados de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    loadSales()
    loadStats()
  }, [currentPage, searchTerm, statusFilter])

  const loadSales = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      }
      
      console.log('Loading sales with params:', params)
      
      const data = await saleService.getSales(params)
      console.log('Sales loaded:', data)
      
      setSales(data.sales || [])
      setPagination(data.pagination || {})
    } catch (error) {
      console.error('Error loading sales:', error)
      setError('Error al cargar las ventas')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await saleService.getSalesStats()
      console.log('Sales stats loaded:', statsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading sales stats:', error)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status === statusFilter ? '' : status)
    setCurrentPage(1)
  }

  const handleCreateSale = () => {
    setSelectedSale(null)
    setModalMode('create')
    setShowModal(true)
  }

  const handleEditSale = (sale) => {
    setSelectedSale(sale)
    setModalMode('edit')
    setShowModal(true)
  }

  const handleViewSale = (sale) => {
    setSelectedSale(sale)
    setModalMode('view')
    setShowModal(true)
  }

  const handleDeleteSale = (sale) => {
    setSaleToDelete(sale)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!saleToDelete) return

    try {
      setDeleteLoading(true)
      await saleService.deleteSale(saleToDelete.id)
      
      // Recargar datos
      await loadSales()
      await loadStats()
      
      setShowDeleteModal(false)
      setSaleToDelete(null)
    } catch (error) {
      console.error('Error deleting sale:', error)
      setError('Error al eliminar la venta: ' + error.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSaveSale = async (saleData) => {
    try {
      setModalLoading(true)
      
      if (modalMode === 'create') {
        await saleService.createSale(saleData)
      } else if (modalMode === 'edit') {
        await saleService.updateSale(selectedSale.id, saleData)
      }
      
      // Recargar datos
      await loadSales()
      await loadStats()
      
      setShowModal(false)
      setSelectedSale(null)
    } catch (error) {
      console.error('Error saving sale:', error)
      throw error // Re-throw to be handled by the form
    } finally {
      setModalLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedSale(null)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  if (loading && currentPage === 1) {
    return <Loading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Gestiona las ventas y facturas del sistema</p>
        </div>
        <Button onClick={handleCreateSale} className="flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError('')}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSales || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {saleService.formatCurrency(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <ShoppingCartIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSales || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completadas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSales || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número de factura o cliente..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtros de estado */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === '' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusFilter('')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handleStatusFilter('completed')}
            >
              Completadas
            </Button>
          </div>
        </div>
      </div>

      {/* Tabla de ventas */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Factura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Cargando ventas...</span>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No se encontraron ventas
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{sale.customer?.name}</div>
                        {sale.customer?.taxId && (
                          <div className="text-xs text-gray-500">{sale.customer.taxId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {saleService.formatSaleDate(sale.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {saleService.formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${saleService.getStatusColor(sale.status)}`}>
                        {saleService.getStatusText(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.user ? `${sale.user.firstName} ${sale.user.lastName}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewSale(sale)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditSale(sale)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSale(sale)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                          disabled={sale.status === 'completed'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pagination.total > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={!pagination.hasPrev}
            >
              Anterior
            </Button>
            <Button
              variant="secondary"
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={!pagination.hasNext}
            >
              Siguiente
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando página <span className="font-medium">{pagination.current}</span> de{' '}
                <span className="font-medium">{pagination.total}</span>
                {' '}({pagination.count} ventas en total)
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current - 1)}
                  disabled={!pagination.hasPrev}
                  className="rounded-l-md"
                >
                  Anterior
                </Button>
                
                {Array.from({ length: Math.min(5, pagination.total) }, (_, i) => {
                  const page = pagination.current - 2 + i;
                  if (page < 1 || page > pagination.total) return null;
                  
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.current ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handlePageChange(pagination.current + 1)}
                  disabled={!pagination.hasNext}
                  className="rounded-r-md"
                >
                  Siguiente
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={
          modalMode === 'create' 
            ? 'Nueva Venta' 
            : modalMode === 'edit' 
              ? 'Editar Venta' 
              : 'Detalles de Venta'
        }
        size="xl"
      >
        {modalMode === 'view' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de Factura</label>
                <p className="text-sm text-gray-900">{selectedSale?.number}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <p className="text-sm text-gray-900">{selectedSale?.customer?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha</label>
                <p className="text-sm text-gray-900">
                  {saleService.formatSaleDate(selectedSale?.date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${saleService.getStatusColor(selectedSale?.status)}`}>
                  {saleService.getStatusText(selectedSale?.status)}
                </span>
              </div>
            </div>
            
            {selectedSale?.items && selectedSale.items.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Productos</label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium">{item.product?.name}</p>
                        <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{saleService.formatCurrency(item.total)}</p>
                        <p className="text-xs text-gray-500">
                          {saleService.formatCurrency(item.unitPrice)} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm">{saleService.formatCurrency(selectedSale?.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">IGV (18%):</span>
                <span className="text-sm">{saleService.formatCurrency(selectedSale?.tax)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t border-blue-200 pt-2">
                <span>Total:</span>
                <span>{saleService.formatCurrency(selectedSale?.total)}</span>
              </div>
            </div>
            
            {selectedSale?.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Notas</label>
                <p className="text-sm text-gray-900">{selectedSale.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <SaleForm
            sale={selectedSale}
            onSave={handleSaveSale}
            onCancel={handleCloseModal}
            loading={modalLoading}
          />
        )}
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirmar Eliminación"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar la venta <strong>{saleToDelete?.number}</strong>?
          </p>
          <p className="text-sm text-red-600">
            Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={confirmDelete}
              loading={deleteLoading}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Ventas