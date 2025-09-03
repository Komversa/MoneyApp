import React from 'react'

/**
 * Diagrama del nuevo flujo de automatizaciones
 * Solo para documentación visual del rediseño
 */
const FlowDiagram = () => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold mb-6 text-center">🎯 Nuevo Flujo de Automatizaciones</h3>
      
      {/* Paso 1 */}
      <div className="flex flex-col lg:flex-row items-center justify-center space-y-4 lg:space-y-0 lg:space-x-8 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 flex-1 max-w-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">1</div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">📝 Detalles de Transacción</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Tipo (Ingreso/Gasto/Transferencia)</li>
              <li>• Monto y descripción</li>
              <li>• Cuentas de origen/destino</li>
              <li>• Categoría</li>
            </ul>
          </div>
        </div>
        
        <div className="text-2xl text-gray-400">→</div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6 flex-1 max-w-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">2</div>
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">⏰ Programación</h4>
            <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
              <li>• Fecha y hora específica</li>
              <li>• Frecuencia (única/diaria/semanal/mensual)</li>
              <li>• Fecha de finalización</li>
              <li>• Vista previa en tiempo real</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="text-center mb-6">
        <div className="text-2xl text-gray-400 mb-4">↓</div>
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 max-w-md mx-auto">
          <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">✓</span>
          </div>
          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎉 Automatización Creada</h4>
          <p className="text-sm text-green-700 dark:text-green-300">
            Control total con fechas y horas exactas
          </p>
        </div>
      </div>

      {/* Características de las tarjetas */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-semibold text-center mb-4">📋 Visualización Mejorada (Tarjetas)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg mb-1">💰</div>
            <p className="text-xs font-medium">Monto prominente</p>
            <p className="text-xs text-gray-500">Con color por tipo</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg mb-1">🔄</div>
            <p className="text-xs font-medium">Frecuencia clara</p>
            <p className="text-xs text-gray-500">Con emoji identificativo</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg mb-1">⏰</div>
            <p className="text-xs font-medium">Próxima ejecución</p>
            <p className="text-xs text-gray-500">Fecha y hora exactas</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-lg mb-1">🎛️</div>
            <p className="text-xs font-medium">Controles intuitivos</p>
            <p className="text-xs text-gray-500">Pausar/Editar/Eliminar</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlowDiagram
