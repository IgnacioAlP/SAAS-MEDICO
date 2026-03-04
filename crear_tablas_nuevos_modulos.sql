-- ====================================
-- CREAR TABLAS: RECETAS, LABORATORIO, INTERNACIONES
-- Ejecutar en phpMyAdmin
-- ====================================

-- RECETAS
CREATE TABLE IF NOT EXISTS recetas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT NOT NULL,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  consulta_id INT NULL,
  fecha_emision DATE NOT NULL DEFAULT (CURRENT_DATE),
  diagnostico TEXT NULL,
  medicamentos TEXT NOT NULL,
  instrucciones TEXT NULL,
  estado VARCHAR(30) DEFAULT 'activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES usuarios(id),
  INDEX idx_clinica (clinica_id),
  INDEX idx_paciente (paciente_id)
);

-- LABORATORIO
CREATE TABLE IF NOT EXISTS laboratorio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT NOT NULL,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  consulta_id INT NULL,
  fecha_solicitud DATE NOT NULL DEFAULT (CURRENT_DATE),
  fecha_resultado DATE NULL,
  tipo_examen VARCHAR(100) NOT NULL,
  descripcion TEXT NULL,
  resultado TEXT NULL,
  estado VARCHAR(30) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES usuarios(id),
  INDEX idx_clinica (clinica_id),
  INDEX idx_paciente (paciente_id)
);

-- INTERNACIONES
CREATE TABLE IF NOT EXISTS internaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT NOT NULL,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_egreso DATETIME NULL,
  motivo TEXT NOT NULL,
  diagnostico TEXT NULL,
  habitacion VARCHAR(20) NULL,
  cama VARCHAR(20) NULL,
  estado VARCHAR(30) DEFAULT 'activa',
  observaciones TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES usuarios(id),
  INDEX idx_clinica (clinica_id),
  INDEX idx_paciente (paciente_id),
  INDEX idx_estado (estado)
);

-- Verificar tablas creadas
SHOW TABLES LIKE 'recetas';
SHOW TABLES LIKE 'laboratorio';
SHOW TABLES LIKE 'internaciones';
