# 🔍 DIAGNÓSTICO: Pacientes no aparecen

## 🚨 Problema Identificado
Los pacientes creados no aparecen en el módulo de Citas.

## ✅ Cambios Implementados

### 1. **Logs de Depuración Mejorados**

#### En Login (auth.controller.ts):
- ✅ Muestra email del login
- ✅ Muestra clinica_id del usuario
- ✅ Muestra clinica_nombre

#### En Crear Paciente (pacientes.controller.ts):
- ✅ Muestra clinica_id que se va a guardar
- ✅ Muestra datos del paciente
- ✅ **NUEVO**: Verifica inmediatamente después del INSERT que el paciente se guardó con el clinica_id correcto

#### En Listar Pacientes (pacientes.controller.ts):
- ✅ Muestra TODOS los pacientes en la BD (últimos 10)
- ✅ Muestra el clinica_id del usuario que consulta
- ✅ Muestra los pacientes filtrados para esa clínica
- ✅ Compara ambos resultados

---

## 📋 PASOS PARA DIAGNOSTICAR

### **Opción 1: Revisar Logs del Backend (RECOMENDADO)**

1. **Reinicia el backend**:
   ```powershell
   cd "C:\Users\User\Desktop\SAAS MEDICO\backend"
   npm run dev
   ```

2. **Haz login** en el sistema y observa el terminal:
   ```
   ============================================================
   🔐 LOGIN ATTEMPT - Email: admin@example.com
   ✅ Usuario encontrado: {
     id: 1,
     nombres: 'Juan',
     apellidos: 'Pérez',
     rol: 'admin',
     clinica_id: 1,        ← ANOTA ESTE NÚMERO
     clinica_nombre: 'Clínica San Rafael'
   }
   ✅ Contraseña correcta
   ============================================================
   ```

3. **Ve al módulo de Pacientes** y crea un nuevo paciente. Observa:
   ```
   === CREAR PACIENTE - INICIO ===
   Clinica ID: 1           ← DEBE COINCIDIR con el login
   Número de historia generado: NH-20260228-0001
   ✅ Paciente insertado, ID: 5
   🔍 VERIFICACIÓN - Paciente guardado: [
     {
       id: 5,
       nombres: 'María',
       apellidos: 'García',
       dni: '12345678',
       clinica_id: 1        ← VERIFICA QUE ES EL MISMO
     }
   ]
   ```

4. **Ve al módulo de Citas** o **Pacientes**. Observa:
   ```
   ============================================================
   🔍 GET ALL PACIENTES
   👤 Usuario: Juan Pérez
   🎭 Rol: admin
   🏥 Clinica ID del usuario: 1    ← DEBE COINCIDIR
   ============================================================
   📊 TODOS LOS PACIENTES EN BD (últimos 10): [
     {
       id: 5,
       nombres: 'María',
       apellidos: 'García',
       dni: '12345678',
       clinica_id: 1,
       activo: 1
     }
   ]
   ✅ Pacientes filtrados para clinica_id 1: 1
   📋 Pacientes de esta clínica: [
     { id: 5, nombre: 'María García', dni: '12345678', clinica_id: 1 }
   ]
   ============================================================
   ```

---

### **Opción 2: Verificar Base de Datos Directamente**

1. **Abre XAMPP** y accede a **phpMyAdmin**

2. **Selecciona la base de datos** (probablemente `sistema_medico`)

3. **Ejecuta el script** `verificar_datos.sql`:
   - En phpMyAdmin, ve a la pestaña **SQL**
   - Copia y pega el contenido de `verificar_datos.sql`
   - Click en **Continuar**

4. **Analiza los resultados**:

   **A. Clínicas**: Verifica que existan clínicas activas
   ```
   id | nombre              | ruc
   1  | Clínica San Rafael  | 20123456789
   ```

   **B. Usuarios**: Verifica que el usuario tenga clinica_id
   ```
   Usuario ID: 1 | Juan Pérez | Email: admin@example.com | Rol: admin | Clínica ID: 1 | Clínica: Clínica San Rafael
   ```

   **C. Pacientes**: Verifica que los pacientes tengan clinica_id
   ```
   Paciente ID: 5 | María García | DNI: 12345678 | Clínica ID: 1 | Clínica: Clínica San Rafael | Activo: 1
   ```

   **D. Resumen**: Debe mostrar conteos
   ```
   Clínica: Clínica San Rafael (ID: 1) | Usuarios: 3 | Pacientes: 5
   ```

   **E. Problemas**: Si hay pacientes con problemas, aparecerán aquí
   ```
   ⚠️ Paciente ID: 3 | Carlos López | Clínica ID: NULL | PROBLEMA: Clínica ID es NULL
   ```

---

## 🔧 SOLUCIONES SEGÚN EL PROBLEMA

### **Problema 1**: Usuario sin clinica_id (clinica_id es NULL)
**Solución**:
```sql
-- Ver usuarios sin clínica
SELECT id, email, nombres, apellidos, rol, clinica_id 
FROM usuarios 
WHERE clinica_id IS NULL AND activo = true;

-- Asignar clínica al usuario (reemplaza IDs correctos)
UPDATE usuarios 
SET clinica_id = 1 
WHERE id = ID_DEL_USUARIO;
```

### **Problema 2**: Pacientes con clinica_id diferente al del usuario
**Síntoma**: Usuario con clinica_id=1 pero pacientes con clinica_id=2

**Solución A - Cambiar id de clínica del usuario**:
```sql
UPDATE usuarios 
SET clinica_id = 2 
WHERE id = ID_DEL_USUARIO;
```

**Solución B - Mover pacientes a la clínica del usuario**:
```sql
UPDATE pacientes 
SET clinica_id = 1 
WHERE clinica_id = 2;
```

### **Problema 3**: Pacientes con clinica_id NULL
**Solución**:
```sql
-- Ver pacientes sin clínica
SELECT id, nombres, apellidos, dni, clinica_id 
FROM pacientes 
WHERE clinica_id IS NULL;

-- Asignarlos a una clínica (reemplaza ID correcto)
UPDATE pacientes 
SET clinica_id = 1 
WHERE clinica_id IS NULL;
```

---

## 📝 REPORTE DEL PROBLEMA

Una vez que revises los logs o la base de datos, comparte esta información:

1. **Del Login**:
   - ¿Qué clinica_id tiene tu usuario?
   - ¿Aparece clinica_nombre?

2. **Del Crear Paciente**:
   - ¿Con qué clinica_id se guardó el paciente?
   - ¿La verificación muestra el paciente correcto?

3. **Del Listar Pacientes**:
   - ¿Cuántos pacientes hay en TOTAL en la BD?
   - ¿Cuántos aparecen filtrados para tu clínica?
   - ¿Los clinica_id coinciden?

4. **De la Base de Datos** (si ejecutaste el SQL):
   - ¿Qué muestra el resumen por clínica?
   - ¿Hay pacientes con problemas?

---

## 🎯 Resultado Esperado

Una vez solucionado, deberías ver:

**En el terminal del backend**:
```
✅ Pacientes filtrados para clinica_id 1: 3
📋 Pacientes de esta clínica: [
  { id: 1, nombre: 'María García', dni: '12345678', clinica_id: 1 },
  { id: 2, nombre: 'Pedro López', dni: '87654321', clinica_id: 1 },
  { id: 3, nombre: 'Ana Martínez', dni: '11223344', clinica_id: 1 }
]
```

**En el módulo de Citas**:
- Dropdown de pacientes debe mostrar todos los pacientes de tu clínica
- Sin mensaje de "No hay pacientes disponibles"
