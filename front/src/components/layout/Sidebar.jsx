import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CubeIcon,
  ShoppingCartIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation()

  const menuItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: HomeIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      name: 'Clientes',
      href: '/clientes',
      icon: UsersIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      name: 'Proveedores',
      href: '/proveedores',
      icon: BuildingOfficeIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      name: 'Inventario',
      href: '/inventario',
      icon: CubeIcon,
      color: 'from-orange-500 to-orange-600'
    },
    {
      name: 'Compras',
      href: '/compras',
      icon: ShoppingCartIcon,
      color: 'from-red-500 to-red-600'
    },
    {
      name: 'Ventas',
      href: '/ventas',
      icon: ChartBarIcon,
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  return (
    <>
      {/* Overlay para móviles */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-20 left-0 z-20 w-72 transition-all duration-300 ease-in-out
        bg-gradient-to-b from-white via-gray-50 to-white border-r border-gray-200/30 shadow-2xl backdrop-blur-xl
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
      style={{ height: 'calc(100vh - 5rem)' }}>
        <div className="h-full px-6 py-8 overflow-y-auto">
          {/* Navigation section */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-6 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Navegación Principal
            </h3>
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`
                        group flex items-center p-4 rounded-2xl transition-all duration-300
                        hover:scale-105 hover:shadow-lg relative overflow-hidden
                        ${isActive 
                          ? `bg-gradient-to-r ${item.color} text-white shadow-xl border border-white/20` 
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border border-gray-100 hover:border-gray-200'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-white/10 rounded-2xl"></div>
                      )}
                      <div className={`
                        relative p-3 rounded-xl mr-4 transition-all duration-300 shadow-lg
                        ${isActive 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : 'bg-white group-hover:bg-white/80 border border-gray-100'
                        }
                      `}>
                        <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'}`} />
                      </div>
                      <div className="relative">
                        <span className="font-semibold text-base">{item.name}</span>
                        {isActive && (
                          <div className="w-full h-0.5 bg-white/50 rounded-full mt-1"></div>
                        )}
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="ml-auto relative">
                          <div className="w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"></div>
                        </div>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar