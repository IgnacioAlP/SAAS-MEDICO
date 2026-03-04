// ========== TIPOS DE BASE DE DATOS ==========

export interface Clinica {
  id: number;
  nombre: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  logo_url: string;
  activo: boolean;
  config: any;
  created_at: Date;
  updated_at: Date;
}

export interface Usuario {
  id: number;
  clinica_id: number;
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  foto_url: string;
  rol: 'admin' | 'medico' | 'enfermero' | 'recepcionista' | 'farmaceutico' | 'administrativo';
  especialidad?: string;
  numero_colegiatura?: string;
  activo: boolean;
  ultima_sesion?: Date;
  config: any;
  created_at: Date;
  updated_at: Date;
}

export interface Paciente {
  id: number;
  clinica_id: number;
  numero_historia: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: Date;
  genero: 'masculino' | 'femenino' | 'otro';
  grupo_sanguineo: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  telefono: string;
  email: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  contacto_emergencia_nombre: string;
  contacto_emergencia_telefono: string;
  contacto_emergencia_relacion: string;
  seguro: string;
  numero_seguro: string;
  alergias: string;
  condiciones_cronicas: string;
  medicamentos_actuales: string;
  foto_url: string;
  activo: boolean;
  observaciones: string;
  created_at: Date;
  updated_at: Date;
}

export interface Consulta {
  id: number;
  clinica_id: number;
  paciente_id: number;
  medico_id: number;
  plantilla_id?: number;
  fecha_hora: Date;
  tipo_consulta: 'primera_vez' | 'seguimiento' | 'control' | 'urgencia' | 'teleconsulta';
  motivo_consulta: string;
  enfermedad_actual: string;
  antecedentes: string;
  examen_fisico: string;
  presion_arterial: string;
  frecuencia_cardiaca: number;
  temperatura: number;
  peso: number;
  talla: number;
  imc: number;
  saturacion_oxigeno: number;
  diagnosticos: string;
  plan_tratamiento: string;
  indicaciones: string;
  datos_adicionales: any;
  proxima_cita?: Date;
  estado: 'en_espera' | 'en_atencion' | 'atendido' | 'cancelado';
  created_at: Date;
  updated_at: Date;
}

export interface Cita {
  id: number;
  clinica_id: number;
  paciente_id: number;
  medico_id: number;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  tipo: string;
  motivo: string;
  estado: 'programada' | 'confirmada' | 'en_espera' | 'atendiendo' | 'atendida' | 'cancelada' | 'no_asistio';
  modalidad: 'presencial' | 'teleconsulta';
  enlace_videollamada?: string;
  observaciones: string;
  recordatorio_enviado: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Receta {
  id: number;
  clinica_id: number;
  consulta_id: number;
  paciente_id: number;
  medico_id: number;
  fecha_emision: Date;
  diagnostico: string;
  indicaciones_generales: string;
  vigencia_dias: number;
  firma_digital: string;
  estado: 'activa' | 'dispensada' | 'vencida' | 'anulada';
  created_at: Date;
  updated_at: Date;
}

export interface RecetaDetalle {
  id: number;
  receta_id: number;
  medicamento: string;
  presentacion: string;
  concentracion: string;
  cantidad: number;
  dosis: string;
  frecuencia: string;
  duracion: string;
  via_administracion: string;
  indicaciones: string;
  created_at: Date;
}

export interface Medicamento {
  id: number;
  clinica_id: number;
  codigo: string;
  nombre: string;
  nombre_generico: string;
  presentacion: string;
  concentracion: string;
  laboratorio: string;
  categoria: string;
  stock: number;
  stock_minimo: number;
  precio_compra: number;
  precio_venta: number;
  fecha_vencimiento: Date;
  lote: string;
  activo: boolean;
  requiere_receta: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Pago {
  id: number;
  clinica_id: number;
  paciente_id: number;
  consulta_id?: number;
  fecha_pago: Date;
  concepto: string;
  monto_total: number;
  descuento: number;
  monto_pagado: number;
  saldo: number;
  estado: 'pendiente' | 'pagado' | 'parcial' | 'anulado';
  observaciones: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

export interface PagoDetalle {
  id: number;
  pago_id: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'yape' | 'plin' | 'transferencia';
  monto: number;
  referencia: string;
  created_at: Date;
}

// ========== TIPOS DE JWT ==========

export interface JWTPayload {
  id: number;
  clinica_id: number;
  email: string;
  rol: string;
  nombres: string;
  apellidos: string;
}

// ========== TIPOS DE REQUEST ==========

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// ========== TIPOS DE RESPUESTA ==========

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========== TIPOS DE FILTROS ==========

export interface PacienteFilters {
  search?: string;
  genero?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

export interface ConsultaFilters {
  paciente_id?: number;
  medico_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_consulta?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

export interface CitaFilters {
  medico_id?: number;
  paciente_id?: number;
  fecha?: string;
  estado?: string;
  page?: number;
  limit?: number;
}
