-- ====================================
-- AGREGAR COLUMNAS FALTANTES A TABLA CITAS
-- Ejecutar en phpMyAdmin
-- ====================================

-- Verificar columnas actuales primero
DESCRIBE citas;

-- Agregar columnas solo si no existen
ALTER TABLE citas
  ADD COLUMN IF NOT EXISTS tipo_cita VARCHAR(50) DEFAULT 'consulta',
  ADD COLUMN IF NOT EXISTS duracion_minutos INT DEFAULT 30,
  ADD COLUMN IF NOT EXISTS observaciones TEXT NULL;

-- Verificar que quedaron bien
DESCRIBE citas;
