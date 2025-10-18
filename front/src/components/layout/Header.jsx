import React, { useState } from 'react'
import { Bars3Icon, UserIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 shadow-2xl border-b border-slate-200/20">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/10"></div>
      <div className="absolute top-2 right-4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-2 left-4 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl"></div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left side */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-3 rounded-2xl text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/10 shadow-lg hover:scale-105"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-100 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                  <span className="text-slate-600 font-black text-2xl">M</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-white font-black text-2xl tracking-tight">MAELZA</h1>
                <p className="text-slate-200 text-sm font-medium">Enterprise Resource Planning</p>
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-6">
            {/* Welcome Message */}
            <div className="hidden lg:block">
              <p className="text-white font-bold text-lg">¡Bienvenido, Sr. Zavala! 👋</p>
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg rounded-2xl px-4 py-3 hover:bg-white/20 transition-all duration-300 border border-white/20 shadow-xl hover:scale-105"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-white to-gray-100 rounded-xl flex items-center justify-center shadow-lg">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-white font-bold text-sm">
                    Sr. Zavala
                  </p>
                  <p className="text-blue-100 text-xs font-medium">
                    Administrador
                  </p>
                </div>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 py-4 z-50">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Z</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Sr. Zavala</p>
                        <p className="text-sm text-gray-500">admin@maelza.com</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-medium mt-1">
                          ● En línea
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-2xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 font-medium"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header