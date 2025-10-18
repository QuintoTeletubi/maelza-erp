import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CubeIcon,
  BanknotesIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlusIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TruckIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  SparklesIcon,
  FireIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarSolidIcon,
  BanknotesIcon as BanknotesIconSolid,
  CubeIcon as CubeIconSolid,
  UsersIcon as UsersIconSolid
} from '@heroicons/react/24/solid'
import Loading from '../components/common/Loading'
import dashboardService from '../services/dashboard.service'
import saleService from '../services/sale.service'
import purchaseService from '../services/purchase.service'
import productService from '../services/product.service'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [recentPurchases, setRecentPurchases] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load all dashboard data in parallel
      const [
        dashboardStats,
        salesData,
        purchasesData,
        lowStockData,
        customersData
      ] = await Promise.all([
        dashboardService.getDashboardStats(),
        saleService.getSales({ page: 1, limit: 5 }),
        purchaseService.getPurchases({ page: 1, limit: 5 }),
        productService.getProducts({ page: 1, limit: 5, lowStock: true }),
        dashboardService.getTopCustomers(5)
      ])

      setStats(dashboardStats)
      setRecentSales(salesData.sales || [])
      setRecentPurchases(purchasesData.purchases || [])
      setLowStockProducts(lowStockData.products || [])
      setTopCustomers(customersData || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return <Loading />
  }

  const formatChange = (change) => {
    if (!change || change === 0) return '0%'
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const getChangeIcon = (change) => {
    if (change > 0) return ArrowTrendingUpIcon
    if (change < 0) return ArrowTrendingDownIcon
    return null
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600 bg-green-100'
    if (change < 0) return 'text-red-600 bg-red-100'
    return 'text-gray-600 bg-gray-100'
  }

  const dashboardStats = [
    {
      name: 'Ventas del Mes',
      value: dashboardService.formatCurrency(stats?.sales?.total || 0),
      change: stats?.sales?.change || 0,
      icon: BanknotesIconSolid,
      outlineIcon: BanknotesIcon,
      color: 'from-emerald-500 via-green-500 to-teal-600',
      bgColor: 'from-emerald-50 via-green-50 to-teal-50',
      borderColor: 'border-emerald-200',
      subtitle: `${stats?.sales?.count || 0} transacciones`,
      description: 'Ingresos generados'
    },
    {
      name: 'Inventario Activo',
      value: dashboardService.formatNumber(stats?.inventory?.totalProducts || 0),
      change: 0,
      icon: CubeIconSolid,
      outlineIcon: CubeIcon,
      color: 'from-blue-500 via-indigo-500 to-purple-600',
      bgColor: 'from-blue-50 via-indigo-50 to-purple-50',
      borderColor: 'border-blue-200',
      subtitle: `${dashboardService.formatNumber(stats?.inventory?.totalUnits || 0)} unidades`,
      description: 'Productos disponibles'
    },
    {
      name: 'Cuentas por Cobrar',
      value: dashboardService.formatCurrency(stats?.financials?.pendingReceivables || 0),
      change: 0,
      icon: ClockIcon,
      outlineIcon: ClockIcon,
      color: 'from-amber-500 via-orange-500 to-red-500',
      bgColor: 'from-amber-50 via-orange-50 to-red-50',
      borderColor: 'border-orange-200',
      subtitle: 'Pendientes de pago',
      description: 'Flujo de caja'
    },
    {
      name: 'Base de Clientes',
      value: dashboardService.formatNumber(stats?.customers?.total || 0),
      change: 0,
      icon: UsersIconSolid,
      outlineIcon: UsersIcon,
      color: 'from-violet-500 via-purple-500 to-indigo-600',
      bgColor: 'from-violet-50 via-purple-50 to-indigo-50',
      borderColor: 'border-violet-200',
      subtitle: `+${stats?.customers?.newThisMonth || 0} nuevos`,
      description: 'Clientes activos'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 -m-6 mb-0 px-8 py-12 shadow-2xl overflow-hidden border-b border-slate-200/30">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-400/20 to-blue-400/20"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.15) 2px, transparent 0)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Dashboard MAELZA</h1>
                <p className="text-blue-200 text-lg">Centro de control empresarial</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-slate-200">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm">{new Date().toLocaleDateString('es-PE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-4 w-4" />
                <span className="text-sm">Sistema activo</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
              <div className="flex items-center space-x-3">
                <BellIcon className="h-5 w-5 text-slate-200" />
                <div>
                  <p className="text-slate-200 text-xs uppercase tracking-wide">Última actualización</p>
                  <p className="text-white font-semibold text-lg">
                    {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
            
            <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2">
              <Cog6ToothIcon className="h-5 w-5" />
              <span>Configuración</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            const OutlineIcon = stat.outlineIcon
            const ChangeIcon = getChangeIcon(stat.change)
            
            return (
              <div key={index} className="group relative">
                <div className={`
                  relative bg-white p-8 rounded-3xl border ${stat.borderColor} 
                  shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2
                  cursor-pointer overflow-hidden
                `}>
                  {/* Background gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="relative">
                        <div className={`
                          p-4 rounded-2xl bg-gradient-to-r ${stat.color} shadow-lg
                          group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500
                        `}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 opacity-30">
                          <OutlineIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      </div>
                      
                      {stat.change !== 0 && (
                        <div className={`
                          px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2
                          ${getChangeColor(stat.change)} shadow-md
                        `}>
                          {ChangeIcon && <ChangeIcon className="h-4 w-4" />}
                          <span>{formatChange(stat.change)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-3xl font-black text-gray-900 mb-1 group-hover:text-gray-800 transition-colors">
                          {stat.value}
                        </p>
                        <p className="text-gray-700 text-lg font-semibold">{stat.name}</p>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200/50">
                        <p className="text-gray-600 text-sm font-medium">{stat.subtitle}</p>
                        <p className="text-gray-500 text-xs mt-1">{stat.description}</p>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 opacity-10">
                      <ChartBarIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 py-2">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Recent Sales - Takes 2.5 columns */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
              <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Actividad de Ventas</h3>
                      <p className="text-green-100">Transacciones más recientes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/ventas')}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2 border border-white/20"
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span>Ver todas</span>
                  </button>
                </div>
                <div className="absolute top-0 right-0 opacity-20">
                  <ChartBarIcon className="h-32 w-32 text-white" />
                </div>
              </div>
              
              <div className="p-8">
                <div className="space-y-4">
                  {recentSales.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="relative">
                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                        </div>
                        <div className="absolute -top-2 -right-8 w-6 h-6 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">¡Listo para empezar!</h3>
                      <p className="text-gray-500">Las ventas aparecerán aquí una vez que realices la primera transacción</p>
                    </div>
                  ) : (
                    recentSales.map((sale, index) => (
                      <div key={sale.id} className="group relative">
                        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center space-x-6">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                                <CurrencyDollarIcon className="h-7 w-7 text-white" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">{index + 1}</span>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center space-x-3 mb-1">
                                <p className="font-bold text-gray-900 text-lg">{sale.number}</p>
                                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  sale.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {sale.status === 'completed' ? '✓ Completada' : '⏳ Pendiente'}
                                </div>
                              </div>
                              <p className="text-gray-600 font-medium">
                                👤 {sale.customer?.name} 
                              </p>
                              <p className="text-gray-500 text-sm flex items-center space-x-2">
                                <CalendarIcon className="h-3 w-3" />
                                <span>{dashboardService.getTimeAgo(sale.createdAt)}</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-black text-2xl text-gray-900 mb-1">
                              {dashboardService.formatCurrency(sale.total)}
                            </p>
                            <div className="flex items-center space-x-2 text-gray-500 text-sm">
                              <FireIcon className="h-3 w-3" />
                              <span>Venta #{sale.id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="xl:col-span-1">
            <div className="space-y-8">
              {/* Quick Actions Panel */}
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="relative bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-6 py-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                      <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Acciones Rápidas</h3>
                  </div>
                  <p className="text-blue-100 text-sm">Gestiona tu negocio</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <button 
                    onClick={() => navigate('/ventas')}
                    className="group w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white p-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <ShoppingBagIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">Nueva Venta</p>
                        <p className="text-green-100 text-sm">Registrar transacción</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/inventario')}
                    className="group w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <CubeIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">Nuevo Producto</p>
                        <p className="text-blue-100 text-sm">Gestionar inventario</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/clientes')}
                    className="group w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white p-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <UsersIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">Nuevo Cliente</p>
                        <p className="text-purple-100 text-sm">Ampliar cartera</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => navigate('/compras')}
                    className="group w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-5 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <TruckIcon className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-lg">Nueva Compra</p>
                        <p className="text-orange-100 text-sm">Abastecer stock</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockProducts.length > 0 && (
                <div className="bg-white rounded-3xl shadow-2xl border border-red-200 overflow-hidden">
                  <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 px-6 py-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl animate-pulse">
                        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">⚠️ Alerta Stock</h3>
                        <p className="text-orange-100 text-sm">Productos por agotar</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-5">
                      {lowStockProducts.slice(0, 4).map((product, index) => (
                        <div key={product.id} className="group mb-4">
                          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-100 group-hover:border-red-200 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex items-center space-x-5">
                              <div className="w-14 h-14 bg-gradient-to-r from-red-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                <CubeIcon className="h-7 w-7 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-base mb-1">{product.name}</p>
                                <p className="text-sm text-gray-500 flex items-center space-x-1">
                                  <span>📦 {product.code}</span>
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center justify-end space-x-2 mb-2">
                                <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-bold shadow-sm">
                                  {product.stock} restantes
                                </div>
                              </div>
                              <p className="text-sm text-gray-500">Mín: {product.minStock}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {lowStockProducts.length > 4 && (
                        <div className="pt-4 mt-6 border-t border-gray-200">
                          <button 
                            onClick={() => navigate('/inventario')}
                            className="w-full bg-gradient-to-r from-red-100 to-orange-100 hover:from-red-200 hover:to-orange-200 text-red-700 p-5 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-105 border border-red-200 shadow-sm hover:shadow-md"
                          >
                            📋 Ver {lowStockProducts.length - 4} productos más en riesgo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Recent Purchases */}
      {recentPurchases.length > 0 && (
        <div className="px-6 pb-8">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Compras Recientes</h3>
                    <p className="text-indigo-100">Abastecimiento y proveedores</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/compras')}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 flex items-center space-x-2 border border-white/20"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>Ver todas</span>
                </button>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {recentPurchases.map((purchase, index) => (
                  <div key={purchase.id} className="group">
                    <div className="bg-gradient-to-br from-white to-indigo-50 p-6 rounded-2xl border border-indigo-100 hover:border-indigo-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <TruckIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                            #{index + 1}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          purchase.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {purchase.status === 'completed' ? '✅ Recibida' : '⏳ Pendiente'}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{purchase.number}</p>
                          <p className="text-gray-600 font-medium flex items-center space-x-1">
                            <span>🏢</span>
                            <span>{purchase.supplier?.name}</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <p className="text-gray-500 text-sm flex items-center space-x-1">
                            <CalendarIcon className="h-3 w-3" />
                            <span>{dashboardService.getTimeAgo(purchase.createdAt)}</span>
                          </p>
                          <p className="font-black text-xl text-gray-900">
                            {dashboardService.formatCurrency(purchase.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard