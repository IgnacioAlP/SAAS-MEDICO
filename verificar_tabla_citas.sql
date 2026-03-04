-- ====================================
-- VERIFICAR Y CORREGIR TABLA CITAS
-- ====================================

-- 1. Verificar si la tabla existe
SELECT 
    'Verificando tabla citas...' as mensaje;

SHOW TABLES LIKE 'citas';

-- 2. Ver estructura de la tabla si existe
DESCRIBE citas;

-- 3. Ver datos de la tabla
SELECT 
    '=== DATOS EN TABLA CITAS ===' as seccion
UNION ALL
SELECT CONCAT(
    'Cita ID: ', id,
    ' | Paciente ID: ', IFNULL(paciente_id, 'NULL'),
    ' | Médico ID: ', IFNULL(medico_id, 'NULL'),
    ' | Clínica ID: ', IFNULL(clinica_id, 'NULL'),
    ' | Fecha: ', fecha_hora,
    ' | Estado: ', estado
) as datos
FROM citas
LIMIT 10;

-- 4. Contar citas por clínica
SELECT 
    '=== CITAS POR CLÍNICA ===' as titulo
UNION ALL
SELECT CONCAT(
    'Clínica ID: ', IFNULL(clinica_id, 'NULL'),
    ' | Cantidad de citas: ', COUNT(*)
) as resumen
FROM citas
GROUP BY clinica_id;

-- 5. Si la tabla no existe o está mal estructurada, usar este script:
/*
CREATE TABLE IF NOT EXISTS citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id INT NOT NULL,
  paciente_id INT NOT NULL,
  medico_id INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  motivo TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente',
  tipo_cita VARCHAR(50) DEFAULT 'consulta',
  duracion_minutos INT DEFAULT 30,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinica_id) REFERENCES clinicas(id),
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (medico_id) REFERENCES usuarios(id),
  INDEX idx_clinica (clinica_id),
  INDEX idx_paciente (paciente_id),
  INDEX idx_medico (medico_id),
  INDEX idx_fecha (fecha_hora),
  INDEX idx_estado (estado)
);
*/
