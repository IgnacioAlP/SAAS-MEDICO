import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  let connection: mysql.Connection | null = null;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nexuscreative_medical',
    });

    console.log('🌱 Iniciando seed de datos...');

    // Hash para contraseñas
    const passwordHash = await bcrypt.hash('12345678', 10);

    // 1. Insertar Clínica
    const [clinicaResult] = await connection.query(`
      INSERT INTO clinicas (nombre, ruc, direccion, telefono, email, logo_url, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'NexusCreative Medical Center',
      '20123456789',
      'Av. Principal 123, Lima',
      '+51 987654321',
      'contacto@nexuscreative.com',
      '/assets/logo-nexuscreative.svg',
      true
    ]);

    const clinicaId = (clinicaResult as any).insertId;
    console.log(`✅ Clínica creada con ID: ${clinicaId}`);

    // 2. Insertar Usuarios
    const usuarios = [
      {
        email: 'admin@nexuscreative.com',
        nombres: 'Carlos',
        apellidos: 'Administrador',
        dni: '12345678',
        rol: 'admin',
        especialidad: null,
      },
      {
        email: 'doctor@nexuscreative.com',
        nombres: 'Juan',
        apellidos: 'Pérez García',
        dni: '23456789',
        rol: 'medico',
        especialidad: 'Medicina General',
        numero_colegiatura: 'CMP-12345'
      },
      {
        email: 'dra.cardio@nexuscreative.com',
        nombres: 'María',
        apellidos: 'López Fernández',
        dni: '34567890',
        rol: 'medico',
        especialidad: 'Cardiología',
        numero_colegiatura: 'CMP-23456'
      },
      {
        email: 'dr.pediatra@nexuscreative.com',
        nombres: 'Roberto',
        apellidos: 'Gutiérrez Silva',
        dni: '45678901',
        rol: 'medico',
        especialidad: 'Pediatría',
        numero_colegiatura: 'CMP-34567'
      },
      {
        email: 'enfermera@nexuscreative.com',
        nombres: 'Ana',
        apellidos: 'Rodríguez',
        dni: '56789012',
        rol: 'enfermero',
        especialidad: null,
      },
      {
        email: 'recepcion@nexuscreative.com',
        nombres: 'Lucía',
        apellidos: 'Martínez',
        dni: '67890123',
        rol: 'recepcionista',
        especialidad: null,
      },
      {
        email: 'farmacia@nexuscreative.com',
        nombres: 'Pedro',
        apellidos: 'Sánchez',
        dni: '78901234',
        rol: 'farmaceutico',
        especialidad: null,
      },
    ];

    for (const usuario of usuarios) {
      await connection.query(`
        INSERT INTO usuarios (clinica_id, email, password, nombres, apellidos, dni, telefono, rol, especialidad, numero_colegiatura, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        clinicaId,
        usuario.email,
        passwordHash,
        usuario.nombres,
        usuario.apellidos,
        usuario.dni,
        '+51 999888777',
        usuario.rol,
        usuario.especialidad,
        (usuario as any).numero_colegiatura || null,
        true
      ]);
    }
    console.log(`✅ ${usuarios.length} usuarios creados`);

    // 3. Insertar Plantillas de Historia Clínica
    const plantillas = [
      {
        nombre: 'Historia Clínica - Medicina General',
        especialidad: 'Medicina General',
        campos: JSON.stringify({
          sections: [
            {
              title: 'Anamnesis',
              fields: ['motivo_consulta', 'enfermedad_actual', 'antecedentes_personales', 'antecedentes_familiares']
            },
            {
              title: 'Examen Físico',
              fields: ['signos_vitales', 'aspecto_general', 'examen_sistemas']
            },
            {
              title: 'Diagnóstico y Plan',
              fields: ['diagnostico_principal', 'diagnosticos_secundarios', 'plan_tratamiento', 'examenes_solicitados']
            }
          ]
        })
      },
      {
        nombre: 'Historia Clínica - Pediatría',
        especialidad: 'Pediatría',
        campos: JSON.stringify({
          sections: [
            {
              title: 'Datos del Menor',
              fields: ['fecha_nacimiento', 'edad', 'peso', 'talla', 'percentiles']
            },
            {
              title: 'Desarrollo',
              fields: ['desarrollo_psicomotor', 'vacunacion', 'alimentacion']
            },
            {
              title: 'Examen Físico Pediátrico',
              fields: ['signos_vitales_pediatricos', 'examen_general', 'examen_sistemas']
            }
          ]
        })
      },
      {
        nombre: 'Historia Clínica - Cardiología',
        especialidad: 'Cardiología',
        campos: JSON.stringify({
          sections: [
            {
              title: 'Evaluación Cardiovascular',
              fields: ['dolor_toracico', 'disnea', 'palpitaciones', 'sincope']
            },
            {
              title: 'Examen Cardiovascular',
              fields: ['presion_arterial', 'frecuencia_cardiaca', 'ritmo', 'soplos', 'pulsos']
            },
            {
              title: 'Estudios',
              fields: ['ecg', 'ecocardiograma', 'prueba_esfuerzo']
            }
          ]
        })
      }
    ];

    for (const plantilla of plantillas) {
      await connection.query(`
        INSERT INTO plantillas_historia (clinica_id, nombre, especialidad, campos, activo)
        VALUES (?, ?, ?, ?, ?)
      `, [clinicaId, plantilla.nombre, plantilla.especialidad, plantilla.campos, true]);
    }
    console.log(`✅ ${plantillas.length} plantillas de historia clínica creadas`);

    // 4. Insertar Pacientes de ejemplo
    const pacientes = [
      {
        numero_historia: 'HC-2026-00001',
        dni: '11223344',
        nombres: 'José',
        apellidos: 'García Mendoza',
        fecha_nacimiento: '1985-05-15',
        genero: 'masculino',
        grupo_sanguineo: 'O+',
        telefono: '+51 988776655',
        email: 'jose.garcia@email.com',
        direccion: 'Jr. Las Flores 456',
        distrito: 'San Isidro',
        provincia: 'Lima',
        departamento: 'Lima',
        alergias: 'Penicilina',
        condiciones_cronicas: 'Hipertensión arterial',
      },
      {
        numero_historia: 'HC-2026-00002',
        dni: '22334455',
        nombres: 'María',
        apellidos: 'Fernández Rojas',
        fecha_nacimiento: '1990-08-22',
        genero: 'femenino',
        grupo_sanguineo: 'A+',
        telefono: '+51 977665544',
        email: 'maria.fernandez@email.com',
        direccion: 'Av. Los Pinos 789',
        distrito: 'Miraflores',
        provincia: 'Lima',
        departamento: 'Lima',
        alergias: 'Ninguna',
        condiciones_cronicas: null,
      },
      {
        numero_historia: 'HC-2026-00003',
        dni: '33445566',
        nombres: 'Carlos',
        apellidos: 'López Vargas',
        fecha_nacimiento: '1978-12-10',
        genero: 'masculino',
        grupo_sanguineo: 'B+',
        telefono: '+51 966554433',
        email: 'carlos.lopez@email.com',
        direccion: 'Calle Los Rosales 321',
        distrito: 'San Borja',
        provincia: 'Lima',
        departamento: 'Lima',
        alergias: 'Aspirina, Mariscos',
        condiciones_cronicas: 'Diabetes Mellitus Tipo 2',
      },
      {
        numero_historia: 'HC-2026-00004',
        dni: '44556677',
        nombres: 'Ana',
        apellidos: 'Quispe Torres',
        fecha_nacimiento: '2018-03-05',
        genero: 'femenino',
        grupo_sanguineo: 'O-',
        telefono: '+51 955443322',
        email: 'contacto.quispe@email.com',
        direccion: 'Jr. Lima 654',
        distrito: 'Pueblo Libre',
        provincia: 'Lima',
        departamento: 'Lima',
        contacto_emergencia_nombre: 'Rosa Torres',
        contacto_emergencia_telefono: '+51 944332211',
        contacto_emergencia_relacion: 'Madre',
        alergias: 'Ninguna',
        condiciones_cronicas: null,
      }
    ];

    for (const paciente of pacientes) {
      await connection.query(`
        INSERT INTO pacientes (
          clinica_id, numero_historia, dni, nombres, apellidos, fecha_nacimiento, genero,
          grupo_sanguineo, telefono, email, direccion, distrito, provincia, departamento,
          contacto_emergencia_nombre, contacto_emergencia_telefono, contacto_emergencia_relacion,
          alergias, condiciones_cronicas, activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        clinicaId,
        paciente.numero_historia,
        paciente.dni,
        paciente.nombres,
        paciente.apellidos,
        paciente.fecha_nacimiento,
        paciente.genero,
        paciente.grupo_sanguineo,
        paciente.telefono,
        paciente.email,
        paciente.direccion,
        paciente.distrito,
        paciente.provincia,
        paciente.departamento,
        paciente.contacto_emergencia_nombre || null,
        paciente.contacto_emergencia_telefono || null,
        paciente.contacto_emergencia_relacion || null,
        paciente.alergias,
        paciente.condiciones_cronicas,
        true
      ]);
    }
    console.log(`✅ ${pacientes.length} pacientes creados`);

    // 5. Insertar medicamentos de ejemplo
    const medicamentos = [
      { codigo: 'MED-001', nombre: 'Paracetamol', nombre_generico: 'Paracetamol', presentacion: 'Tableta', concentracion: '500mg', laboratorio: 'Genérico', categoria: 'Analgésico', stock: 100, precio_venta: 0.50 },
      { codigo: 'MED-002', nombre: 'Ibuprofeno', nombre_generico: 'Ibuprofeno', presentacion: 'Tableta', concentracion: '400mg', laboratorio: 'Genérico', categoria: 'Antiinflamatorio', stock: 80, precio_venta: 0.80 },
      { codigo: 'MED-003', nombre: 'Amoxicilina', nombre_generico: 'Amoxicilina', presentacion: 'Cápsula', concentracion: '500mg', laboratorio: 'Farmindustria', categoria: 'Antibiótico', stock: 60, precio_venta: 1.20, requiere_receta: true },
      { codigo: 'MED-004', nombre: 'Losartán', nombre_generico: 'Losartán', presentacion: 'Tableta', concentracion: '50mg', laboratorio: 'Medifarma', categoria: 'Antihipertensivo', stock: 50, precio_venta: 1.50, requiere_receta: true },
      { codigo: 'MED-005', nombre: 'Metformina', nombre_generico: 'Metformina', presentacion: 'Tableta', concentracion: '850mg', laboratorio: 'Roemmers', categoria: 'Antidiabético', stock: 70, precio_venta: 1.00, requiere_receta: true },
      { codigo: 'MED-006', nombre: 'Omeprazol', nombre_generico: 'Omeprazol', presentacion: 'Cápsula', concentracion: '20mg', laboratorio: 'Genérico', categoria: 'Antiácido', stock: 90, precio_venta: 0.70 },
      { codigo: 'MED-007', nombre: 'Loratadina', nombre_generico: 'Loratadina', presentacion: 'Tableta', concentracion: '10mg', laboratorio: 'Bayer', categoria: 'Antihistamínico', stock: 40, precio_venta: 0.60 },
      { codigo: 'MED-008', nombre: 'Enalapril', nombre_generico: 'Enalapril', presentacion: 'Tableta', concentracion: '10mg', laboratorio: 'Medifarma', categoria: 'Antihipertensivo', stock: 55, precio_venta: 0.90, requiere_receta: true },
    ];

    for (const med of medicamentos) {
      await connection.query(`
        INSERT INTO medicamentos (
          clinica_id, codigo, nombre, nombre_generico, presentacion, concentracion,
          laboratorio, categoria, stock, stock_minimo, precio_venta, requiere_receta, activo
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 10, ?, ?, ?)
      `, [
        clinicaId, med.codigo, med.nombre, med.nombre_generico, med.presentacion,
        med.concentracion, med.laboratorio, med.categoria, med.stock,
        med.precio_venta, med.requiere_receta || false, true
      ]);
    }
    console.log(`✅ ${medicamentos.length} medicamentos creados`);

    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:         admin@nexuscreative.com / 12345678');
    console.log('🩺 Médico:        doctor@nexuscreative.com / 12345678');
    console.log('❤️  Cardiólogo:   dra.cardio@nexuscreative.com / 12345678');
    console.log('👶 Pediatra:      dr.pediatra@nexuscreative.com / 12345678');
    console.log('💉 Enfermera:     enfermera@nexuscreative.com / 12345678');
    console.log('📞 Recepción:     recepcion@nexuscreative.com / 12345678');
    console.log('💊 Farmacia:      farmacia@nexuscreative.com / 12345678');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar seed
seed()
  .then(() => {
    console.log('\n✅ Proceso de seed finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal en el seed:', error);
    process.exit(1);
  });
