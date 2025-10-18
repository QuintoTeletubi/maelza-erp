import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShoppingCartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { 
  getPurchases, 
  createPurchase, 
  updatePurchase, 
  deletePurchase, 
  getPurchaseStats,
  formatCurrency,
  formatDate,
  formatPurchaseNumber,
  formatPurchaseStatus,
  getStatusColor
} from '../services/purchase.service'
import Modal from '../components/modals/Modal'
import Loading from '../components/common/Loading'
import Button from '../components/common/Button'
import PurchaseForm from '../components/forms/PurchaseForm'

const Compras = () => {
  // States
  const [purchases, setPurchases] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    received: 0,
    cancelled: 0,
    totalAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Effects
  useEffect(() => {
    loadData()
  }, [currentPage, searchTerm, statusFilter])

  useEffect(() => {
    loadStats()
  }, [purchases])

  // Data loading
  const loadData = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      }

      const response = await getPurchases(params)
      
      setPurchases(response.purchases || [])
      setTotalPages(response.totalPages || 1)
      setTotalRecords(response.total || 0)
    } catch (error) {
      console.error('Error loading purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await getPurchaseStats()
      setStats(response)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Modal handlers
  const handleCreatePurchase = () => {
    setSelectedPurchase(null)
    setShowCreateModal(true)
  }

  const handleEditPurchase = (purchase) => {
    setSelectedPurchase(purchase)
    setShowEditModal(true)
  }

  const handleViewPurchase = (purchase) => {
    setSelectedPurchase(purchase)
    setShowViewModal(true)
  }

  const handleCloseModals = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setSelectedPurchase(null)
  }

  // CRUD operations
  const handleSubmitPurchase = async (purchaseData) => {
    try {
      setActionLoading(true)
      
      if (selectedPurchase) {
        await updatePurchase(selectedPurchase.id, purchaseData)
      } else {
        await createPurchase(purchaseData)
      }

      await loadData()
      handleCloseModals()
    } catch (error) {
      console.error('Error saving purchase:', error)
      alert('Error al guardar la compra: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeletePurchase = async (purchase) => {
    if (!confirm(`¿Está seguro de eliminar la compra ${formatPurchaseNumber(purchase.number)}?`)) {
      return
    }

    try {
      setActionLoading(true)
      await deletePurchase(purchase.id)
      await loadData()
    } catch (error) {
      console.error('Error deleting purchase:', error)
      alert('Error al eliminar la compra: ' + error.message)
    } finally {
      setActionLoading(false)
    }
  }

  // Search handlers
  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadData()
  }

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setCurrentPage(1)
  }

  // Render helpers
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-4 w-4" />
      case 'RECEIVED':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'CANCELLED':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ShoppingCartIcon className="h-4 w-4" />
    }
  }

  const renderPurchaseView = () => {
    if (!selectedPurchase) return null

    return (
      <div className="space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {formatPurchaseNumber(selectedPurchase.number)}
          </h3>
          <p className="text-gray-600">
            {formatDate(selectedPurchase.date)} - {selectedPurchase.supplier?.name}
          </p>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedPurchase.status)}`}>
              {getStatusIcon(selectedPurchase.status)}
              {formatPurchaseStatus(selectedPurchase.status)}
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Artículos</h4>
          <div className="space-y-2">
            {selectedPurchase.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{item.product?.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(item.subtotal)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">{formatCurrency(selectedPurchase.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>IGV:</span>
              <span className="font-medium">{formatCurrency(selectedPurchase.tax)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(selectedPurchase.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {selectedPurchase.notes && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
              {selectedPurchase.notes}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Compras</h1>
        <p className="text-gray-600">Administra las compras de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Compras Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recibidas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.received}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShoppingCartIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar compras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
              <Button type="submit" size="sm">
                Buscar
              </Button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendientes</option>
              <option value="RECEIVED">Recibidas</option>
              <option value="PARTIAL">Parciales</option>
              <option value="CANCELLED">Canceladas</option>
            </select>

            {(searchTerm || statusFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Limpiar Filtros
              </Button>
            )}
          </div>

          <Button
            onClick={handleCreatePurchase}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            Nueva Compra
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8">
            <Loading />
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay compras</h3>
            <p className="text-gray-600">Comienza creando tu primera compra</p>
            <Button
              onClick={handleCreatePurchase}
              className="mt-4"
            >
              Nueva Compra
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
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
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPurchaseNumber(purchase.number)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{purchase.supplier?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(purchase.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(purchase.total)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(purchase.status)}`}>
                          {getStatusIcon(purchase.status)}
                          {formatPurchaseStatus(purchase.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPurchase(purchase)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver compra"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditPurchase(purchase)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Editar compra"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchase(purchase)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar compra"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, totalRecords)} de {totalRecords} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseModals}
          title="Nueva Compra"
          size="4xl"
        >
          <PurchaseForm
            onSubmit={handleSubmitPurchase}
            onCancel={handleCloseModals}
            loading={actionLoading}
          />
        </Modal>
      )}

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={handleCloseModals}
          title="Editar Compra"
          size="4xl"
        >
          <PurchaseForm
            purchase={selectedPurchase}
            onSubmit={handleSubmitPurchase}
            onCancel={handleCloseModals}
            loading={actionLoading}
          />
        </Modal>
      )}

      {showViewModal && (
        <Modal
          isOpen={showViewModal}
          onClose={handleCloseModals}
          title="Detalle de Compra"
          size="2xl"
        >
          {renderPurchaseView()}
        </Modal>
      )}
    </div>
  )
}

export default Compras