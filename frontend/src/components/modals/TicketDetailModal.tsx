import React from 'react';
import { useQuery } from '@tanstack/react-query';
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

const fetchTicketDetail = async (ticketId: number): Promise<TicketDetail> => {
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
  const { data: ticketDetail, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['ticketDetail', ticketId],
    queryFn: () => fetchTicketDetail(ticketId!),
    enabled: isOpen && ticketId !== null,
    staleTime: 2 * 60 * 1000, // 2 min — detalle de ticket no cambia frecuentemente
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Error desconocido') : null;

  const getStatusStyle = (status?: string): React.CSSProperties => {
    switch (status?.toLowerCase()) {
      case 'abierto':
      case 'open':
        return { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' };
      case 'cerrado':
      case 'closed':
        return { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
      case 'resuelto':
      case 'resolved':
        return { background: 'color-mix(in srgb, var(--info) 15%, transparent)', color: 'var(--info)' };
      default:
        return { background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' };
    }
  };

  const getPriorityStyle = (priority?: string): React.CSSProperties => {
    switch (priority?.toLowerCase()) {
      case 'alta':
      case 'high':
        return { background: 'color-mix(in srgb, var(--error) 15%, transparent)', color: 'var(--error)' };
      case 'media':
      case 'medium':
        return { background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' };
      case 'baja':
      case 'low':
        return { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' };
      default:
        return { background: 'var(--bg-tertiary)', color: 'var(--text-muted)' };
    }
  };

  const renderThreadBody = (body: string): string => {
    // Sanitizar: eliminar tags HTML y decodificar entidades comunes
    const stripped = body
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    return stripped.length > 400 ? `${stripped.substring(0, 400)}...` : stripped;
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
          className="fixed inset-0 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />

        {/* Modal - Versión simplificada para debugging */}
        <div className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform z-50" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)' }}>
          {/* Header */}
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center space-x-3">
              <div style={{ padding: '0.5rem', background: 'var(--accent-primary-glow)', borderRadius: 'var(--radius-md)' }}>
                <DocumentTextIcon className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div>
                <h2 className="font-display" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Detalle del Ticket
                </h2>
                {ticketDetail && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    #{ticketDetail.number}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ padding: '0.5rem', color: 'var(--text-muted)', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8" style={{ borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent-primary)' }}></div>
                <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Cargando detalle del ticket...</span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--error)' }} />
                  <p style={{ color: 'var(--error)', fontWeight: 500 }}>Error al cargar el ticket</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{error}</p>
                  <button
                    onClick={() => refetch()}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'var(--font-body)' }}
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {ticketDetail && !loading && !error && (
              <div className="space-y-6">
                {/* Información General */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h3 className="font-display flex items-center mb-4" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <InformationCircleIcon className="w-5 h-5 mr-2" style={{ color: 'var(--accent-primary)' }} />
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Asunto
                      </label>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {ticketDetail.subject || 'Sin asunto'}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Estado
                      </label>
                      <span style={{ display: 'inline-flex', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-full)', ...getStatusStyle(ticketDetail.status?.name) }}>
                        {ticketDetail.status?.name || 'Sin estado'}
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Prioridad
                      </label>
                      <span style={{ display: 'inline-flex', padding: '0.15rem 0.6rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-full)', ...getPriorityStyle(ticketDetail.priority?.priority) }}>
                        {ticketDetail.priority?.priority || 'Sin prioridad'}
                      </span>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Departamento
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {ticketDetail.department?.name || 'Sin departamento'}
                      </p>
                    </div>
                    {ticketDetail.customFields?.find(f => f.field_name === 'Empresa') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Empresa</label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Empresa')!.field_value)}
                        </p>
                      </div>
                    )}
                    {ticketDetail.customFields?.find(f => f.field_name === 'Localidad / Sucursal / Sector') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Localidad / Sucursal / Sector</label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Localidad / Sucursal / Sector')!.field_value)}
                        </p>
                      </div>
                    )}
                    {ticketDetail.customFields?.find(f => f.field_name === 'Transporte') && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Transporte</label>
                        <p style={{ color: 'var(--text-primary)' }}>
                          {parseCustomFieldValue(ticketDetail.customFields.find(f => f.field_name === 'Transporte')!.field_value)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personas Involucradas */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h3 className="font-display flex items-center mb-4" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <UserGroupIcon className="w-5 h-5 mr-2" style={{ color: 'var(--accent-primary)' }} />
                    Personas Involucradas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <UserIcon className="w-4 h-4 mr-1" />
                        Usuario
                      </label>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ticketDetail.user?.name || 'Usuario desconocido'}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{(ticketDetail.user as any)?.email || ''}</p>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        <UserIcon className="w-4 h-4 mr-1" />
                        Agente Asignado
                      </label>
                      <div>
                        <p style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                          {ticketDetail.AssignedStaff
                            ? `${ticketDetail.AssignedStaff.firstname} ${ticketDetail.AssignedStaff.lastname}`
                            : 'Sin asignar'
                          }
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {(ticketDetail.AssignedStaff as any)?.email || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h3 className="font-display flex items-center mb-4" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <ClockIcon className="w-5 h-5 mr-2" style={{ color: 'var(--success)' }} />
                    Fechas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Fecha de Creación
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {ticketDetail.created ? new Date(ticketDetail.created).toLocaleString('es-ES') : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        Fecha de Cierre
                      </label>
                      <p style={{ color: 'var(--text-primary)' }}>
                        {ticketDetail.closed ? new Date(ticketDetail.closed).toLocaleString('es-ES') : 'Aún abierto'}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Threads/Respuestas */}
                {ticketDetail.threads && ticketDetail.threads.length > 0 && (
                  <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                    <h3 className="font-display flex items-center mb-4" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" style={{ color: 'var(--accent-primary)' }} />
                      Conversación ({ticketDetail.threads.length})
                    </h3>
                    <div className="space-y-4" style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                      {ticketDetail.threads.map((thread) => (
                        <div key={thread.entry_id} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-3">
                              <div style={{ width: '2.5rem', height: '2.5rem', background: 'var(--accent-primary-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                  {thread.staff_firstname ? thread.staff_firstname[0] :
                                   thread.user_name ? thread.user_name[0] :
                                   thread.poster ? thread.poster[0] : '?'}
                                </span>
                              </div>
                              <div>
                                <p style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                  {thread.staff_firstname && thread.staff_lastname
                                    ? `${thread.staff_firstname} ${thread.staff_lastname}`.trim()
                                    : thread.user_name || thread.poster || 'Usuario'
                                  }
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {thread.created ? new Date(thread.created).toLocaleString('es-ES') : ''}
                                </p>
                              </div>
                            </div>
                            <span style={{
                              padding: '0.15rem 0.6rem', fontSize: '0.75rem', borderRadius: 'var(--radius-full)',
                              ...(thread.staff_id
                                ? { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }
                                : { background: 'color-mix(in srgb, var(--info) 15%, transparent)', color: 'var(--info)' })
                            }}>
                              {thread.staff_id ? 'Agente' : 'Usuario'}
                            </span>
                          </div>

                          {thread.title && (
                            <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '0.9375rem' }}>
                              {thread.title}
                            </h4>
                          )}

                          {/* Renderizado seguro: sin dangerouslySetInnerHTML */}
                          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                            {renderThreadBody(thread.body || 'Sin contenido')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-6 mt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onClose}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 150ms ease' }}
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
