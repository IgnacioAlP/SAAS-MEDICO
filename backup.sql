-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: nexuscreative_medical
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auditoria`
--

DROP TABLE IF EXISTS `auditoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `accion` varchar(100) NOT NULL,
  `tabla` varchar(100) DEFAULT NULL,
  `registro_id` int(11) DEFAULT NULL,
  `datos_anteriores` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_anteriores`)),
  `datos_nuevos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_nuevos`)),
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_tabla` (`tabla`,`registro_id`),
  KEY `idx_fecha` (`created_at`),
  CONSTRAINT `auditoria_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auditoria_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria`
--

LOCK TABLES `auditoria` WRITE;
/*!40000 ALTER TABLE `auditoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `auditoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `citas`
--

DROP TABLE IF EXISTS `citas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `citas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `tipo` varchar(100) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `estado` enum('programada','confirmada','en_espera','atendiendo','atendida','cancelada','no_asistio') DEFAULT 'programada',
  `modalidad` enum('presencial','teleconsulta') DEFAULT 'presencial',
  `enlace_videollamada` varchar(500) DEFAULT NULL,
  `observaciones` text DEFAULT NULL,
  `recordatorio_enviado` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tipo_cita` varchar(50) DEFAULT 'consulta',
  `duracion_minutos` int(11) DEFAULT 30,
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `idx_medico_fecha` (`medico_id`,`fecha`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_fecha` (`fecha`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `citas`
--

LOCK TABLES `citas` WRITE;
/*!40000 ALTER TABLE `citas` DISABLE KEYS */;
/*!40000 ALTER TABLE `citas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinicas`
--

DROP TABLE IF EXISTS `clinicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clinicas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `ruc` varchar(20) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinicas`
--

LOCK TABLES `clinicas` WRITE;
/*!40000 ALTER TABLE `clinicas` DISABLE KEYS */;
/*!40000 ALTER TABLE `clinicas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_smtp`
--

DROP TABLE IF EXISTS `configuracion_smtp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracion_smtp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `smtp_host` varchar(255) DEFAULT 'smtp.gmail.com',
  `smtp_port` int(11) DEFAULT 587,
  `smtp_user` varchar(255) DEFAULT '',
  `smtp_password` varchar(255) DEFAULT '',
  `smtp_from` varchar(255) DEFAULT '',
  `smtp_secure` tinyint(1) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `clinica_id` (`clinica_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_smtp`
--

LOCK TABLES `configuracion_smtp` WRITE;
/*!40000 ALTER TABLE `configuracion_smtp` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracion_smtp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultas`
--

DROP TABLE IF EXISTS `consultas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `consultas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `plantilla_id` int(11) DEFAULT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `tipo_consulta` enum('primera_vez','seguimiento','control','urgencia','teleconsulta') DEFAULT 'primera_vez',
  `motivo_consulta` text DEFAULT NULL,
  `enfermedad_actual` text DEFAULT NULL,
  `antecedentes` text DEFAULT NULL,
  `examen_fisico` text DEFAULT NULL,
  `presion_arterial` varchar(20) DEFAULT NULL,
  `frecuencia_cardiaca` int(11) DEFAULT NULL,
  `temperatura` decimal(4,2) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `talla` decimal(5,2) DEFAULT NULL,
  `imc` decimal(5,2) DEFAULT NULL,
  `saturacion_oxigeno` int(11) DEFAULT NULL,
  `diagnosticos` text DEFAULT NULL,
  `plan_tratamiento` text DEFAULT NULL,
  `indicaciones` text DEFAULT NULL,
  `datos_adicionales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`datos_adicionales`)),
  `proxima_cita` date DEFAULT NULL,
  `estado` enum('en_espera','en_atencion','atendido','cancelado') DEFAULT 'en_espera',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `plantilla_id` (`plantilla_id`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_medico` (`medico_id`),
  KEY `idx_fecha` (`fecha_hora`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `consultas_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_ibfk_4` FOREIGN KEY (`plantilla_id`) REFERENCES `plantillas_historia` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultas`
--

LOCK TABLES `consultas` WRITE;
/*!40000 ALTER TABLE `consultas` DISABLE KEYS */;
/*!40000 ALTER TABLE `consultas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documentos`
--

DROP TABLE IF EXISTS `documentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `consulta_id` int(11) DEFAULT NULL,
  `tipo` enum('imagen','estudio','receta','consentimiento','otro') NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `archivo_url` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `tamanio` int(11) DEFAULT NULL,
  `subido_por` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `subido_por` (`subido_por`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_tipo` (`tipo`),
  CONSTRAINT `documentos_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documentos_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documentos_ibfk_3` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `documentos_ibfk_4` FOREIGN KEY (`subido_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documentos`
--

LOCK TABLES `documentos` WRITE;
/*!40000 ALTER TABLE `documentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `documentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internacion_evoluciones`
--

DROP TABLE IF EXISTS `internacion_evoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `internacion_evoluciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `internacion_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo` enum('medica','enfermeria','otro') DEFAULT 'medica',
  `evolucion` text NOT NULL,
  `signos_vitales` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`signos_vitales`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_internacion` (`internacion_id`),
  KEY `idx_fecha` (`fecha_hora`),
  CONSTRAINT `internacion_evoluciones_ibfk_1` FOREIGN KEY (`internacion_id`) REFERENCES `internaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `internacion_evoluciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internacion_evoluciones`
--

LOCK TABLES `internacion_evoluciones` WRITE;
/*!40000 ALTER TABLE `internacion_evoluciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `internacion_evoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internaciones`
--

DROP TABLE IF EXISTS `internaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `internaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_responsable_id` int(11) NOT NULL,
  `numero_cama` varchar(50) DEFAULT NULL,
  `numero_habitacion` varchar(50) DEFAULT NULL,
  `piso` varchar(20) DEFAULT NULL,
  `fecha_ingreso` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fecha_alta` timestamp NULL DEFAULT NULL,
  `motivo_internacion` text DEFAULT NULL,
  `diagnostico_ingreso` text DEFAULT NULL,
  `diagnostico_alta` text DEFAULT NULL,
  `tipo_alta` enum('medica','voluntaria','derivacion','fallecimiento') DEFAULT NULL,
  `estado` enum('activa','alta','transferido') DEFAULT 'activa',
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `medico_responsable_id` (`medico_responsable_id`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_ingreso` (`fecha_ingreso`),
  CONSTRAINT `internaciones_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `internaciones_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `internaciones_ibfk_3` FOREIGN KEY (`medico_responsable_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internaciones`
--

LOCK TABLES `internaciones` WRITE;
/*!40000 ALTER TABLE `internaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `internaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laboratorio_resultados`
--

DROP TABLE IF EXISTS `laboratorio_resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `laboratorio_resultados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `solicitud_id` int(11) NOT NULL,
  `resultado_texto` text DEFAULT NULL,
  `interpretacion` text DEFAULT NULL,
  `archivo_url` varchar(500) DEFAULT NULL,
  `procesado_por` int(11) DEFAULT NULL,
  `fecha_proceso` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `procesado_por` (`procesado_por`),
  KEY `idx_solicitud` (`solicitud_id`),
  CONSTRAINT `laboratorio_resultados_ibfk_1` FOREIGN KEY (`solicitud_id`) REFERENCES `laboratorio_solicitudes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laboratorio_resultados_ibfk_2` FOREIGN KEY (`procesado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laboratorio_resultados`
--

LOCK TABLES `laboratorio_resultados` WRITE;
/*!40000 ALTER TABLE `laboratorio_resultados` DISABLE KEYS */;
/*!40000 ALTER TABLE `laboratorio_resultados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `laboratorio_solicitudes`
--

DROP TABLE IF EXISTS `laboratorio_solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `laboratorio_solicitudes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `consulta_id` int(11) DEFAULT NULL,
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo_estudio` enum('laboratorio','imagen','otros') NOT NULL,
  `estudios_solicitados` text NOT NULL,
  `indicaciones` text DEFAULT NULL,
  `prioridad` enum('normal','urgente') DEFAULT 'normal',
  `estado` enum('pendiente','en_proceso','completado','cancelado') DEFAULT 'pendiente',
  `fecha_resultado` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `medico_id` (`medico_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_solicitud`),
  CONSTRAINT `laboratorio_solicitudes_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laboratorio_solicitudes_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laboratorio_solicitudes_ibfk_3` FOREIGN KEY (`medico_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `laboratorio_solicitudes_ibfk_4` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `laboratorio_solicitudes`
--

LOCK TABLES `laboratorio_solicitudes` WRITE;
/*!40000 ALTER TABLE `laboratorio_solicitudes` DISABLE KEYS */;
/*!40000 ALTER TABLE `laboratorio_solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medicamentos`
--

DROP TABLE IF EXISTS `medicamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medicamentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `codigo` varchar(50) DEFAULT NULL,
  `nombre` varchar(255) NOT NULL,
  `nombre_generico` varchar(255) DEFAULT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `concentracion` varchar(100) DEFAULT NULL,
  `laboratorio` varchar(255) DEFAULT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `stock` int(11) DEFAULT 0,
  `stock_minimo` int(11) DEFAULT 10,
  `precio_compra` decimal(10,2) DEFAULT NULL,
  `precio_venta` decimal(10,2) DEFAULT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `lote` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `requiere_receta` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_clinica` (`clinica_id`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_stock` (`stock`),
  CONSTRAINT `medicamentos_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medicamentos`
--

LOCK TABLES `medicamentos` WRITE;
/*!40000 ALTER TABLE `medicamentos` DISABLE KEYS */;
/*!40000 ALTER TABLE `medicamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(100) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `idx_usuario_leida` (`usuario_id`,`leida`),
  KEY `idx_fecha` (`created_at`),
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pacientes`
--

DROP TABLE IF EXISTS `pacientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pacientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `numero_historia` varchar(50) NOT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('masculino','femenino','otro') DEFAULT NULL,
  `grupo_sanguineo` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `distrito` varchar(100) DEFAULT NULL,
  `provincia` varchar(100) DEFAULT NULL,
  `departamento` varchar(100) DEFAULT NULL,
  `contacto_emergencia_nombre` varchar(255) DEFAULT NULL,
  `contacto_emergencia_telefono` varchar(50) DEFAULT NULL,
  `contacto_emergencia_relacion` varchar(100) DEFAULT NULL,
  `seguro` varchar(255) DEFAULT NULL,
  `numero_seguro` varchar(100) DEFAULT NULL,
  `alergias` text DEFAULT NULL,
  `condiciones_cronicas` text DEFAULT NULL,
  `medicamentos_actuales` text DEFAULT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_historia` (`clinica_id`,`numero_historia`),
  KEY `idx_clinica` (`clinica_id`),
  KEY `idx_dni` (`dni`),
  KEY `idx_nombres` (`nombres`,`apellidos`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pacientes`
--

LOCK TABLES `pacientes` WRITE;
/*!40000 ALTER TABLE `pacientes` DISABLE KEYS */;
/*!40000 ALTER TABLE `pacientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago_detalle`
--

DROP TABLE IF EXISTS `pago_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pago_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pago_id` int(11) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','yape','plin','transferencia') NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `referencia` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pago` (`pago_id`),
  CONSTRAINT `pago_detalle_ibfk_1` FOREIGN KEY (`pago_id`) REFERENCES `pagos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago_detalle`
--

LOCK TABLES `pago_detalle` WRITE;
/*!40000 ALTER TABLE `pago_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `pago_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `consulta_id` int(11) DEFAULT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  `concepto` varchar(255) NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `descuento` decimal(10,2) DEFAULT 0.00,
  `monto_pagado` decimal(10,2) NOT NULL,
  `saldo` decimal(10,2) DEFAULT 0.00,
  `estado` enum('pendiente','pagado','parcial','anulado') DEFAULT 'pagado',
  `observaciones` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_fecha` (`fecha_pago`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `pagos_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plantillas_historia`
--

DROP TABLE IF EXISTS `plantillas_historia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plantillas_historia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `especialidad` varchar(255) DEFAULT NULL,
  `campos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`campos`)),
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_clinica_especialidad` (`clinica_id`,`especialidad`),
  CONSTRAINT `plantillas_historia_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantillas_historia`
--

LOCK TABLES `plantillas_historia` WRITE;
/*!40000 ALTER TABLE `plantillas_historia` DISABLE KEYS */;
/*!40000 ALTER TABLE `plantillas_historia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receta_detalle`
--

DROP TABLE IF EXISTS `receta_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `receta_detalle` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `receta_id` int(11) NOT NULL,
  `medicamento` varchar(255) NOT NULL,
  `presentacion` varchar(100) DEFAULT NULL,
  `concentracion` varchar(100) DEFAULT NULL,
  `cantidad` int(11) NOT NULL,
  `dosis` varchar(255) DEFAULT NULL,
  `frecuencia` varchar(255) DEFAULT NULL,
  `duracion` varchar(100) DEFAULT NULL,
  `via_administracion` varchar(100) DEFAULT NULL,
  `indicaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_receta` (`receta_id`),
  CONSTRAINT `receta_detalle_ibfk_1` FOREIGN KEY (`receta_id`) REFERENCES `recetas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receta_detalle`
--

LOCK TABLES `receta_detalle` WRITE;
/*!40000 ALTER TABLE `receta_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `receta_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recetas`
--

DROP TABLE IF EXISTS `recetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recetas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `consulta_id` int(11) DEFAULT NULL,
  `paciente_id` int(11) NOT NULL,
  `medico_id` int(11) NOT NULL,
  `fecha_emision` timestamp NOT NULL DEFAULT current_timestamp(),
  `diagnostico` text DEFAULT NULL,
  `indicaciones_generales` text DEFAULT NULL,
  `vigencia_dias` int(11) DEFAULT 30,
  `firma_digital` text DEFAULT NULL,
  `estado` enum('activa','dispensada','vencida','anulada') DEFAULT 'activa',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `clinica_id` (`clinica_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `idx_paciente` (`paciente_id`),
  KEY `idx_medico` (`medico_id`),
  KEY `idx_fecha` (`fecha_emision`),
  CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_ibfk_3` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_ibfk_4` FOREIGN KEY (`medico_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recetas`
--

LOCK TABLES `recetas` WRITE;
/*!40000 ALTER TABLE `recetas` DISABLE KEYS */;
/*!40000 ALTER TABLE `recetas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clinica_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombres` varchar(255) NOT NULL,
  `apellidos` varchar(255) NOT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `foto_url` varchar(500) DEFAULT NULL,
  `rol` enum('admin','medico','enfermero','recepcionista','farmaceutico','administrativo') NOT NULL,
  `especialidad` varchar(255) DEFAULT NULL,
  `numero_colegiatura` varchar(100) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `ultima_sesion` timestamp NULL DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_clinica` (`clinica_id`),
  KEY `idx_rol` (`rol`),
  CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-03 22:54:08
