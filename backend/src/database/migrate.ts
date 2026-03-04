import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const migrate = async () => {
  let connection: mysql.Connection | null = null;

  try {
    // Conectar sin especificar base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('🔄 Iniciando migración de base de datos...');

    // Crear base de datos si no existe
    const dbName = process.env.DB_NAME || 'nexuscreative_medical';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de datos ${dbName} creada/verificada`);

    await connection.query(`USE ${dbName}`);

    // TABLA: Clínicas (Multi-tenancy)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS clinicas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        ruc VARCHAR(20),
        direccion TEXT,
        telefono VARCHAR(50),
        email VARCHAR(255),
        logo_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla clinicas creada');

    // TABLA: Usuarios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        dni VARCHAR(20),
        telefono VARCHAR(50),
        foto_url VARCHAR(500),
        rol ENUM('admin', 'medico', 'enfermero', 'recepcionista', 'farmaceutico', 'administrativo') NOT NULL,
        especialidad VARCHAR(255),
        numero_colegiatura VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        ultima_sesion TIMESTAMP NULL,
        config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        INDEX idx_email (email),
        INDEX idx_clinica (clinica_id),
        INDEX idx_rol (rol)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla usuarios creada');

    // TABLA: Pacientes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        numero_historia VARCHAR(50) NOT NULL,
        dni VARCHAR(20),
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        fecha_nacimiento DATE,
        genero ENUM('masculino', 'femenino', 'otro'),
        grupo_sanguineo ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
        telefono VARCHAR(50),
        email VARCHAR(255),
        direccion TEXT,
        distrito VARCHAR(100),
        provincia VARCHAR(100),
        departamento VARCHAR(100),
        contacto_emergencia_nombre VARCHAR(255),
        contacto_emergencia_telefono VARCHAR(50),
        contacto_emergencia_relacion VARCHAR(100),
        seguro VARCHAR(255),
        numero_seguro VARCHAR(100),
        alergias TEXT,
        condiciones_cronicas TEXT,
        medicamentos_actuales TEXT,
        foto_url VARCHAR(500),
        activo BOOLEAN DEFAULT TRUE,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        UNIQUE KEY unique_historia (clinica_id, numero_historia),
        INDEX idx_clinica (clinica_id),
        INDEX idx_dni (dni),
        INDEX idx_nombres (nombres, apellidos)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla pacientes creada');

    // TABLA: Plantillas de Historia Clínica
    await connection.query(`
      CREATE TABLE IF NOT EXISTS plantillas_historia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        especialidad VARCHAR(255),
        campos JSON NOT NULL,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        INDEX idx_clinica_especialidad (clinica_id, especialidad)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla plantillas_historia creada');

    // TABLA: Consultas/Atenciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS consultas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        medico_id INT NOT NULL,
        plantilla_id INT,
        fecha_hora TIMESTAMP NOT NULL,
        tipo_consulta ENUM('primera_vez', 'seguimiento', 'control', 'urgencia', 'teleconsulta') DEFAULT 'primera_vez',
        motivo_consulta TEXT,
        enfermedad_actual TEXT,
        antecedentes TEXT,
        examen_fisico TEXT,
        presion_arterial VARCHAR(20),
        frecuencia_cardiaca INT,
        temperatura DECIMAL(4,2),
        peso DECIMAL(5,2),
        talla DECIMAL(5,2),
        imc DECIMAL(5,2),
        saturacion_oxigeno INT,
        diagnosticos TEXT,
        plan_tratamiento TEXT,
        indicaciones TEXT,
        datos_adicionales JSON,
        proxima_cita DATE,
        estado ENUM('en_espera', 'en_atencion', 'atendido', 'cancelado') DEFAULT 'en_espera',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (plantilla_id) REFERENCES plantillas_historia(id) ON DELETE SET NULL,
        INDEX idx_paciente (paciente_id),
        INDEX idx_medico (medico_id),
        INDEX idx_fecha (fecha_hora),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla consultas creada');

    // TABLA: Citas/Agenda
    await connection.query(`
      CREATE TABLE IF NOT EXISTS citas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        medico_id INT NOT NULL,
        fecha DATE NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        tipo VARCHAR(100),
        motivo TEXT,
        estado ENUM('programada', 'confirmada', 'en_espera', 'atendiendo', 'atendida', 'cancelada', 'no_asistio') DEFAULT 'programada',
        modalidad ENUM('presencial', 'teleconsulta') DEFAULT 'presencial',
        enlace_videollamada VARCHAR(500),
        observaciones TEXT,
        recordatorio_enviado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_medico_fecha (medico_id, fecha),
        INDEX idx_paciente (paciente_id),
        INDEX idx_fecha (fecha),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla citas creada');

    // TABLA: Recetas/Prescripciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recetas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        consulta_id INT NOT NULL,
        paciente_id INT NOT NULL,
        medico_id INT NOT NULL,
        fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        diagnostico TEXT,
        indicaciones_generales TEXT,
        vigencia_dias INT DEFAULT 30,
        firma_digital TEXT,
        estado ENUM('activa', 'dispensada', 'vencida', 'anulada') DEFAULT 'activa',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_paciente (paciente_id),
        INDEX idx_medico (medico_id),
        INDEX idx_fecha (fecha_emision)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla recetas creada');

    // TABLA: Detalle de Recetas (Medicamentos)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS receta_detalle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        receta_id INT NOT NULL,
        medicamento VARCHAR(255) NOT NULL,
        presentacion VARCHAR(100),
        concentracion VARCHAR(100),
        cantidad INT NOT NULL,
        dosis VARCHAR(255),
        frecuencia VARCHAR(255),
        duracion VARCHAR(100),
        via_administracion VARCHAR(100),
        indicaciones TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
        INDEX idx_receta (receta_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla receta_detalle creada');

    // TABLA: Medicamentos (para Farmacia)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS medicamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        codigo VARCHAR(50),
        nombre VARCHAR(255) NOT NULL,
        nombre_generico VARCHAR(255),
        presentacion VARCHAR(100),
        concentracion VARCHAR(100),
        laboratorio VARCHAR(255),
        categoria VARCHAR(100),
        stock INT DEFAULT 0,
        stock_minimo INT DEFAULT 10,
        precio_compra DECIMAL(10,2),
        precio_venta DECIMAL(10,2),
        fecha_vencimiento DATE,
        lote VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        requiere_receta BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        INDEX idx_clinica (clinica_id),
        INDEX idx_nombre (nombre),
        INDEX idx_stock (stock)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla medicamentos creada');

    // TABLA: Laboratorio - Solicitudes de Estudios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS laboratorio_solicitudes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        medico_id INT NOT NULL,
        consulta_id INT,
        fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo_estudio ENUM('laboratorio', 'imagen', 'otros') NOT NULL,
        estudios_solicitados TEXT NOT NULL,
        indicaciones TEXT,
        prioridad ENUM('normal', 'urgente') DEFAULT 'normal',
        estado ENUM('pendiente', 'en_proceso', 'completado', 'cancelado') DEFAULT 'pendiente',
        fecha_resultado TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (medico_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
        INDEX idx_paciente (paciente_id),
        INDEX idx_estado (estado),
        INDEX idx_fecha (fecha_solicitud)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla laboratorio_solicitudes creada');

    // TABLA: Laboratorio - Resultados
    await connection.query(`
      CREATE TABLE IF NOT EXISTS laboratorio_resultados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        solicitud_id INT NOT NULL,
        resultado_texto TEXT,
        interpretacion TEXT,
        archivo_url VARCHAR(500),
        procesado_por INT,
        fecha_proceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (solicitud_id) REFERENCES laboratorio_solicitudes(id) ON DELETE CASCADE,
        FOREIGN KEY (procesado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_solicitud (solicitud_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla laboratorio_resultados creada');

    // TABLA: Internaciones/Hospitalizaciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS internaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        medico_responsable_id INT NOT NULL,
        numero_cama VARCHAR(50),
        numero_habitacion VARCHAR(50),
        piso VARCHAR(20),
        fecha_ingreso TIMESTAMP NOT NULL,
        fecha_alta TIMESTAMP NULL,
        motivo_internacion TEXT,
        diagnostico_ingreso TEXT,
        diagnostico_alta TEXT,
        tipo_alta ENUM('medica', 'voluntaria', 'derivacion', 'fallecimiento') NULL,
        estado ENUM('activa', 'alta', 'transferido') DEFAULT 'activa',
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (medico_responsable_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_paciente (paciente_id),
        INDEX idx_estado (estado),
        INDEX idx_fecha_ingreso (fecha_ingreso)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla internaciones creada');

    // TABLA: Evoluciones de Internación
    await connection.query(`
      CREATE TABLE IF NOT EXISTS internacion_evoluciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        internacion_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tipo ENUM('medica', 'enfermeria', 'otro') DEFAULT 'medica',
        evolucion TEXT NOT NULL,
        signos_vitales JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (internacion_id) REFERENCES internaciones(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_internacion (internacion_id),
        INDEX idx_fecha (fecha_hora)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla internacion_evoluciones creada');

    // TABLA: Pagos y Facturación
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pagos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        consulta_id INT,
        fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        concepto VARCHAR(255) NOT NULL,
        monto_total DECIMAL(10,2) NOT NULL,
        descuento DECIMAL(10,2) DEFAULT 0,
        monto_pagado DECIMAL(10,2) NOT NULL,
        saldo DECIMAL(10,2) DEFAULT 0,
        estado ENUM('pendiente', 'pagado', 'parcial', 'anulado') DEFAULT 'pagado',
        observaciones TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_paciente (paciente_id),
        INDEX idx_fecha (fecha_pago),
        INDEX idx_estado (estado)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla pagos creada');

    // TABLA: Detalle de Pagos (multi-pago)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pago_detalle (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pago_id INT NOT NULL,
        metodo_pago ENUM('efectivo', 'tarjeta', 'yape', 'plin', 'transferencia') NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        referencia VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
        INDEX idx_pago (pago_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla pago_detalle creada');

    // TABLA: Documentos/Archivos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        paciente_id INT NOT NULL,
        consulta_id INT,
        tipo ENUM('imagen', 'estudio', 'receta', 'consentimiento', 'otro') NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT,
        archivo_url VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100),
        tamanio INT,
        subido_por INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
        FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL,
        FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_paciente (paciente_id),
        INDEX idx_tipo (tipo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla documentos creada');

    // TABLA: Auditoría
    await connection.query(`
      CREATE TABLE IF NOT EXISTS auditoria (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        usuario_id INT,
        accion VARCHAR(100) NOT NULL,
        tabla VARCHAR(100),
        registro_id INT,
        datos_anteriores JSON,
        datos_nuevos JSON,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
        INDEX idx_usuario (usuario_id),
        INDEX idx_tabla (tabla, registro_id),
        INDEX idx_fecha (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla auditoria creada');

    // TABLA: Notificaciones
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notificaciones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clinica_id INT NOT NULL,
        usuario_id INT NOT NULL,
        tipo VARCHAR(100) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        mensaje TEXT NOT NULL,
        leida BOOLEAN DEFAULT FALSE,
        url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        INDEX idx_usuario_leida (usuario_id, leida),
        INDEX idx_fecha (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla notificaciones creada');

    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('📊 Todas las tablas han sido creadas en la base de datos');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar migración
migrate()
  .then(() => {
    console.log('\n✅ Proceso de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en la migración:', error);
    process.exit(1);
  });
