import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon, 
  UserIcon, 
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  BuildingOfficeIcon,
  InformationCircleIcon,
  UserGroupIcon,
  CogIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';
import type { TicketDetail } from '../../types';
import logger from '../../utils/logger';

interface TicketThread {
  entry_id: number;
  thread_id: number;
  poster: string;
  title: string;
  body: string;
  created: string;
  staff_id?: number;
  staff_firstname?: string;
  staff_lastname?: string;
  user_name?: string;
}

interface CustomField {
  field_name: string;
  field_value: string;
  field_type: string;
}

// Función para obtener el detalle del ticket
const getTicketDetail = async (ticketId: number): Promise<TicketDetail> => {
  const response = await fetch(`/api/tickets/${ticketId}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: number | null;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({ isOpen, onClose, ticketId }) => {
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetail();
    }
  }, [isOpen, ticketId]);

  const fetchTicketDetail = async () => {
    if (!ticketId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 DATOS DEL TICKET RECIBIDOS:', data);
      console.log('🔍 ASUNTO:', data.subject);
      console.log('🔍 THREADS:', data.threads);
      console.log('🔍 PRIMER THREAD:', data.threads?.[0]);
      setTicketDetail(data);
      logger.info(`Detalle de ticket ${ticketId} cargado exitosamente`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      logger.error(`Error al cargar detalle del ticket ${ticketId}:`, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'abierto':
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cerrado':
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'resuelto':
      case 'resolved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'alta':
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'media':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'baja':
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const renderThreadBody = (body: string) => {
    // Limpiar HTML básico y mostrar texto plano
    const cleanText = body.replace(/<[^>]*>/g, '').trim();
    return cleanText.length > 300 ? `${cleanText.substring(0, 300)}...` : cleanText;
  };

  const parseCustomFieldValue = (value: string): string => {
    try {
      const parsed = JSON.parse(value);
      const key = Object.keys(parsed)[0];
      return parsed[key] || 'Sin valor';
    } catch (e) {
      return value || 'Sin valor';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80"
          onClick={onClose}
        />

        {/* Modal - Versión simplificada para debugging */}
        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-slate-800 shadow-xl rounded-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-600">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Detalle del Ticket
                </h2>
                {ticketDetail && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    #{ticketDetail.number}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando detalle del ticket...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400 font-medium">Error al cargar el ticket</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error}</p>
                  <button
                    onClick={fetchTicketDetail}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {ticketDetail && !loading && !error && (
              <div className="space-y-6">
                {/* Información General */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <InformationCircleIcon className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Asunto
                      </label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {ticketDetail.subject || 'Sin asunto'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticketDetail.status?.name === 'Open' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : ticketDetail.status?.name === 'Closed'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {ticketDetail.status?.name || 'Sin estado'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Prioridad
                      </label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ticketDetail.priority?.priority === 'High'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : ticketDetail.priority?.priority === 'Normal'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {ticketDetail.priority?.priority || 'Sin prioridad'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Departamento
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {ticketDetail.department?.name || 'Sin departamento'}
                      </p>
                    </div>
                    {ticketDetail.customFields?.find(f => f.field_name === 'Empresa') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                        <p className="text-gray-900 dark:text-white">
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Empresa')!.field_value)}
                        </p>
                      </div>
                    )}
                    {ticketDetail.customFields?.find(f => f.field_name === 'Localidad / Sucursal / Sector') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Localidad / Sucursal / Sector</label>
                        <p className="text-gray-900 dark:text-white">
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Localidad / Sucursal / Sector')!.field_value)}
                        </p>
                      </div>
                    )}
                    {ticketDetail.customFields?.find(f => f.field_name === 'Transporte') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transporte</label>
                        <p className="text-gray-900 dark:text-white">
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Transporte')!.field_value)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personas Involucradas */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Personas Involucradas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <UserIcon className="w-4 h-4 inline mr-1" />
                        Usuario
                      </label>
                      <div className="text-gray-900 dark:text-white">
                        <p className="font-medium">{ticketDetail.user?.name || 'Usuario desconocido'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{(ticketDetail.user as any)?.email || ''}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <UserIcon className="w-4 h-4 inline mr-1" />
                        Agente Asignado
                      </label>
                      <div className="text-gray-900 dark:text-white">
                        <p className="font-medium">
                          {ticketDetail.AssignedStaff 
                            ? `${ticketDetail.AssignedStaff.firstname} ${ticketDetail.AssignedStaff.lastname}`
                            : 'Sin asignar'
                          }
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {(ticketDetail.AssignedStaff as any)?.email || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                    Fechas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Creación
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {ticketDetail.created ? new Date(ticketDetail.created).toLocaleString('es-ES') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Cierre
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {ticketDetail.closed ? new Date(ticketDetail.closed).toLocaleString('es-ES') : 'Aún abierto'}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Threads/Respuestas */}
                {ticketDetail.threads && ticketDetail.threads.length > 0 && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                      Conversación ({ticketDetail.threads.length})
                    </h3>
                     <div className="space-y-4 max-h-96 overflow-y-auto">
                      {ticketDetail.threads.map((thread, index) => (
                        <div key={thread.entry_id} className="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {thread.staff_firstname ? thread.staff_firstname[0] : 
                                   thread.user_name ? thread.user_name[0] : 
                                   thread.poster ? thread.poster[0] : '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {thread.staff_firstname && thread.staff_lastname 
                                    ? `${thread.staff_firstname} ${thread.staff_lastname}`.trim()
                                    : thread.user_name || thread.poster || 'Usuario'
                                  }
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {thread.created ? new Date(thread.created).toLocaleString('es-ES') : ''}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              thread.staff_id 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {thread.staff_id ? 'Agente' : 'Usuario'}
                            </span>
                          </div>
                          
                          {/* Título del thread si existe */}
                          {thread.title && (
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base">
                              {thread.title}
                            </h4>
                          )}
                          
                          {/* Contenido del thread */}
                          <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ 
                              __html: thread.body || '<p class="text-gray-500 italic">Sin contenido</p>' 
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-slate-600">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
