-- ====================================
-- SCRIPT DE VERIFICACIÓN DE DATOS
-- ====================================

-- 1. Ver todas las clínicas
SELECT 
    '=== CLÍNICAS ===' as seccion, 
    NULL as id, 
    NULL as nombre, 
    NULL as valor, 
    NULL as clinica_id
UNION ALL
SELECT 
    'CLINICA' as seccion,
    id,
    nombre,
    ruc as valor,
    NULL as clinica_id
FROM clinicas 
WHERE activo = true
ORDER BY id;

-- 2. Ver todos los usuarios y su clínica
SELECT 
    '=== USUARIOS ===' as seccion
UNION ALL
SELECT CONCAT(
    'Usuario ID: ', u.id, 
    ' | ', u.nombres, ' ', u.apellidos,
    ' | Email: ', u.email,
    ' | Rol: ', u.rol,
    ' | Clínica ID: ', IFNULL(u.clinica_id, 'NULL'),
    ' | Clínica: ', IFNULL(c.nombre, 'SIN CLÍNICA')
) as info
FROM usuarios u
LEFT JOIN clinicas c ON u.clinica_id = c.id
WHERE u.activo = true
ORDER BY u.id;

-- 3. Ver todos los pacientes con su clínica
SELECT 
    '=== PACIENTES ===' as seccion
UNION ALL
SELECT CONCAT(
    'Paciente ID: ', p.id,
    ' | ', p.nombres, ' ', p.apellidos,
    ' | DNI: ', p.dni,
    ' | Clínica ID: ', IFNULL(p.clinica_id, 'NULL'),
    ' | Clínica: ', IFNULL(c.nombre, 'SIN CLÍNICA'),
    ' | Activo: ', p.activo
) as info
FROM pacientes p
LEFT JOIN clinicas c ON p.clinica_id = c.id
ORDER BY p.id;

-- 4. Resumen por clínica
SELECT 
    '=== RESUMEN POR CLÍNICA ===' as titulo
UNION ALL
SELECT CONCAT(
    'Clínica: ', c.nombre,
    ' (ID: ', c.id, ')',
    ' | Usuarios: ', COUNT(DISTINCT u.id),
    ' | Pacientes: ', COUNT(DISTINCT p.id)
) as resumen
FROM clinicas c
LEFT JOIN usuarios u ON c.id = u.clinica_id AND u.activo = true
LEFT JOIN pacientes p ON c.id = p.clinica_id AND p.activo = true
WHERE c.activo = true
GROUP BY c.id, c.nombre;

-- 5. Pacientes sin clínica o con clínica inválida
SELECT 
    '=== PACIENTES CON PROBLEMAS ===' as titulo
UNION ALL
SELECT CONCAT(
    '⚠️ Paciente ID: ', p.id,
    ' | ', p.nombres, ' ', p.apellidos,
    ' | Clínica ID: ', IFNULL(p.clinica_id, 'NULL'),
    ' | PROBLEMA: ', 
    CASE 
        WHEN p.clinica_id IS NULL THEN 'Clínica ID es NULL'
        WHEN c.id IS NULL THEN 'Clínica no existe'
        WHEN c.activo = false THEN 'Clínica inactiva'
        ELSE 'OK'
    END
) as problema
FROM pacientes p
LEFT JOIN clinicas c ON p.clinica_id = c.id
WHERE p.activo = true 
  AND (p.clinica_id IS NULL OR c.id IS NULL OR c.activo = false);
