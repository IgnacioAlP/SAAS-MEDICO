import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { Paciente } from '../types';

// Listar todos los pacientes
export const getAllPacientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const clinicaId = req.user?.clinica_id;
    console.log('='.repeat(60));
    console.log('🔍 GET ALL PACIENTES');
    console.log('👤 Usuario:', req.user?.nombres, req.user?.apellidos);
    console.log('🎭 Rol:', req.user?.rol);
    console.log('🏥 Clinica ID del usuario:', clinicaId);
    console.log('='.repeat(60));
    
    // Primero, consultar TODOS los pacientes para diagnóstico
    const todosPacientes = await query('SELECT id, nombres, apellidos, dni, clinica_id, activo FROM pacientes ORDER BY created_at DESC LIMIT 10');
    console.log('📊 TODOS LOS PACIENTES EN BD (últimos 10):', JSON.stringify(todosPacientes, null, 2));
    
    // Ahora la consulta filtrada
    const pacientes = await query<Paciente[]>(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM citas WHERE paciente_id = p.id) as total_citas,
        (SELECT COUNT(*) FROM consultas WHERE paciente_id = p.id) as total_consultas
       FROM pacientes p 
       WHERE p.clinica_id = ? AND p.activo = true
       ORDER BY p.created_at DESC`,
      [clinicaId]
    );

    console.log('✅ Pacientes filtrados para clinica_id', clinicaId + ':', pacientes.length);
    if (pacientes.length > 0) {
      console.log('📋 Pacientes de esta clínica:', pacientes.map(p => ({
        id: p.id,
        nombre: `${p.nombres} ${p.apellidos}`,
        dni: p.dni,
        clinica_id: p.clinica_id
      })));
    } else {
      console.log('⚠️ NO SE ENCONTRARON PACIENTES PARA ESTA CLÍNICA');
      console.log('💡 Verifica que los pacientes se estén guardando con clinica_id:', clinicaId);
    }
    console.log('='.repeat(60));

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('❌ Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener pacientes'
    });
  }
};

// Obtener un paciente por ID
export const getPacienteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('=== GET PACIENTE BY ID - INICIO ===');
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    console.log('Buscando paciente ID:', id, 'Clinica:', clinicaId);

    const pacientes = await query<Paciente[]>(
      'SELECT * FROM pacientes WHERE id = ? AND clinica_id = ? AND activo = true',
      [id, clinicaId]
    );

    console.log('Pacientes encontrados:', pacientes.length);

    if (pacientes.length === 0) {
      console.log('Paciente no encontrado');
      res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
      });
      return;
    }

    console.log('Cargando estadísticas...');
    // Obtener estadísticas de citas y consultas
    const [citasCount, consultasCount] = await Promise.all([
      query('SELECT COUNT(*) as count FROM citas WHERE paciente_id = ?', [id]),
      query('SELECT COUNT(*) as count FROM consultas WHERE paciente_id = ?', [id])
    ]);

    console.log('Citas count:', citasCount);
    console.log('Consultas count:', consultasCount);

    const pacienteData = pacientes[0];
    
    // Parsear datos de texto a arrays si están en formato JSON
    let alergias: any[] = [];
    let contactosEmergencia: any[] = [];
    let tratamientosActuales: any[] = [];
    
    try {
      if (pacienteData.alergias) {
        alergias = typeof pacienteData.alergias === 'string' 
          ? [{ descripcion: pacienteData.alergias }]
          : pacienteData.alergias;
      }
    } catch (e) {
      console.log('Error parseando alergias:', e);
    }

    // Agregar contacto de emergencia si existe
    if (pacienteData.contacto_emergencia_nombre) {
      contactosEmergencia.push({
        nombre: pacienteData.contacto_emergencia_nombre,
        relacion: pacienteData.contacto_emergencia_relacion,
        telefono: pacienteData.contacto_emergencia_telefono
      });
    }

    // Agregar medicamentos actuales si existen
    if (pacienteData.medicamentos_actuales) {
      tratamientosActuales = typeof pacienteData.medicamentos_actuales === 'string'
        ? [{ descripcion: pacienteData.medicamentos_actuales }]
        : pacienteData.medicamentos_actuales;
    }

    const response = {
      success: true,
      data: {
        ...pacienteData,
        alergias,
        contactos_emergencia: contactosEmergencia,
        tratamientos_actuales: tratamientosActuales,
        total_citas: (citasCount as any)[0]?.count || 0,
        total_consultas: (consultasCount as any)[0]?.count || 0
      }
    };

    console.log('Respuesta exitosa:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error: any) {
    console.error('=== ERROR AL OBTENER PACIENTE ===');
    console.error('Error completo:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) console.error('Error code:', error.code);
    if (error.sqlMessage) console.error('SQL Error:', error.sqlMessage);
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener paciente: ' + (error.message || 'Error desconocido')
    });
  }
};

// Crear nuevo paciente
export const createPaciente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('=== CREAR PACIENTE - INICIO ===');
    const clinicaId = req.user?.clinica_id;
    console.log('Clinica ID:', clinicaId);
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    const {
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      fecha_nacimiento,
      genero,
      telefono,
      email,
      direccion,
      distrito,
      provincia,
      departamento,
      grupo_sanguineo,
      alergias,
      contactos_emergencia
    } = req.body;

    // Validar campos requeridos
    if (!numero_documento || !nombres || !apellidos) {
      console.log('Error: Campos requeridos faltantes');
      res.status(400).json({
        success: false,
        error: 'Documento, nombres y apellidos son requeridos'
      });
      return;
    }

    console.log('Verificando documento existente...');
    // Verificar si el documento ya existe (usando dni)
    const existingPaciente = await query(
      'SELECT id FROM pacientes WHERE dni = ? AND clinica_id = ?',
      [numero_documento, clinicaId]
    );

    if (Array.isArray(existingPaciente) && existingPaciente.length > 0) {
      console.log('Error: Documento ya existe');
      res.status(400).json({
        success: false,
        error: 'Ya existe un paciente con este número de documento'
      });
      return;
    }

    console.log('Generando número de historia...');
    // Generar número de historia único
    const fecha = new Date();
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    
    // Obtener el contador del día
    const countResult = await query(
      'SELECT COUNT(*) as count FROM pacientes WHERE clinica_id = ? AND DATE(created_at) = CURDATE()',
      [clinicaId]
    ) as any[];
    const count = (countResult[0]?.count || 0) + 1;
    const numero_historia = `NH-${year}${month}${day}-${String(count).padStart(4, '0')}`;
    console.log('Número de historia generado:', numero_historia);

    console.log('Insertando paciente en BD...');
    
    // Convertir valores undefined o vacíos a null para la BD
    const cleanValue = (value: any) => {
      if (value === undefined || value === '') return null;
      return value;
    };
    
    const valores = {
      clinicaId, 
      numero_historia, 
      dni: numero_documento, 
      nombres, 
      apellidos,
      fecha_nacimiento: cleanValue(fecha_nacimiento), 
      genero: cleanValue(genero), 
      telefono: cleanValue(telefono), 
      email: cleanValue(email), 
      direccion: cleanValue(direccion), 
      distrito: cleanValue(distrito),
      provincia: cleanValue(provincia), 
      departamento: cleanValue(departamento), 
      grupo_sanguineo: cleanValue(grupo_sanguineo)
    };
    
    console.log('Valores a insertar:', valores);
    
    // Insertar paciente (usando los campos correctos de la BD)
    const result = await query(
      `INSERT INTO pacientes (
        clinica_id, numero_historia, dni, nombres, apellidos,
        fecha_nacimiento, genero, telefono, email, direccion, distrito,
        provincia, departamento, grupo_sanguineo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        valores.clinicaId,
        valores.numero_historia,
        valores.dni,
        valores.nombres,
        valores.apellidos,
        valores.fecha_nacimiento,
        valores.genero,
        valores.telefono,
        valores.email,
        valores.direccion,
        valores.distrito,
        valores.provincia,
        valores.departamento,
        valores.grupo_sanguineo
      ]
    );

    console.log('✅ Paciente insertado, ID:', (result as any).insertId);
    const pacienteId = (result as any).insertId;

    // Verificar que se guardó correctamente
    const verificacion = await query('SELECT id, nombres, apellidos, dni, clinica_id FROM pacientes WHERE id = ?', [pacienteId]);
    console.log('🔍 VERIFICACIÓN - Paciente guardado:', verificacion);

    // Insertar alergias si existen
    if (alergias && Array.isArray(alergias) && alergias.length > 0) {
      for (const alergia of alergias) {
        await query(
          'INSERT INTO alergias (paciente_id, tipo, descripcion, gravedad) VALUES (?, ?, ?, ?)',
          [pacienteId, alergia.tipo, alergia.descripcion, alergia.gravedad]
        );
      }
    }

    // Insertar contactos de emergencia si existen
    if (contactos_emergencia && Array.isArray(contactos_emergencia) && contactos_emergencia.length > 0) {
      for (const contacto of contactos_emergencia) {
        await query(
          'INSERT INTO contactos_emergencia (paciente_id, nombre, relacion, telefono) VALUES (?, ?, ?, ?)',
          [pacienteId, contacto.nombre, contacto.relacion, contacto.telefono]
        );
      }
    }

    res.status(201).json({
      success: true,
      data: {
        id: pacienteId,
        message: 'Paciente creado exitosamente'
      }
    });
    console.log('=== CREAR PACIENTE - FIN EXITOSO ===');
  } catch (error: any) {
    console.error('=== ERROR AL CREAR PACIENTE ===');
    console.error('Error completo:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.code) console.error('Error code:', error.code);
    if (error.sqlMessage) console.error('SQL Error:', error.sqlMessage);
    if (error.sql) console.error('SQL Query:', error.sql);
    
    res.status(500).json({
      success: false,
      error: 'Error al crear paciente: ' + (error.message || 'Error desconocido')
    });
  }
};

// Actualizar paciente
export const updatePaciente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;
    const updateData = req.body;

    // Verificar que el paciente existe y pertenece a la clínica
    const pacientes = await query<Paciente[]>(
      'SELECT id FROM pacientes WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );

    if (pacientes.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
      });
      return;
    }

    // Construir query de actualización dinámicamente
    const allowedFields = [
      'nombres', 'apellidos', 'fecha_nacimiento', 'genero', 'telefono', 'email',
      'direccion', 'distrito', 'provincia', 'departamento', 'grupo_sanguineo', 'dni'
    ];

    // Función para limpiar valores
    const cleanValue = (value: any) => {
      if (value === undefined || value === '') return null;
      return value;
    };

    const updates: string[] = [];
    const values: any[] = [];

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(cleanValue(updateData[key]));
      }
    });

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No hay campos válidos para actualizar'
      });
      return;
    }

    values.push(id);

    await query(
      `UPDATE pacientes SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar paciente'
    });
  }
};

// Eliminar paciente (soft delete)
export const deletePaciente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const clinicaId = req.user?.clinica_id;

    await query(
      'UPDATE pacientes SET activo = false WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar paciente'
    });
  }
};

// Buscar pacientes
export const searchPacientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    const clinicaId = req.user?.clinica_id;

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido'
      });
      return;
    }

    const searchTerm = `%${q}%`;
    
    const pacientes = await query<Paciente[]>(
      `SELECT * FROM pacientes 
       WHERE clinica_id = ? AND activo = true
       AND (nombres LIKE ? OR apellidos LIKE ? OR dni LIKE ? OR numero_historia LIKE ?)
       ORDER BY nombres, apellidos
       LIMIT 20`,
      [clinicaId, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      data: pacientes
    });
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar pacientes'
    });
  }
};
