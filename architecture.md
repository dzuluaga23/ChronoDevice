# Architecture

## 1. Visión general del proyecto

Sistema de gestión de activos, garantías y mantenimiento para empresas.

El objetivo es permitir que una empresa tenga control sobre sus equipos físicos:

* Computadores
* Impresoras
* Celulares
* Routers
* Cámaras
* Herramientas
* Aires acondicionados
* Maquinaria
* Otros activos

Cada activo tendrá un historial completo de su ciclo de vida:

```text
Compra
   ↓
Registro en el sistema
   ↓
Asignación de responsable
   ↓
Uso
   ↓
Mantenimientos
   ↓
Reparaciones
   ↓
Garantía
   ↓
Costos acumulados
   ↓
Retiro o reemplazo
```

La aplicación funcionará como un historial clínico para los activos de una empresa.

---

# 2. Objetivos del producto

El sistema debe permitir:

* Registrar activos.
* Clasificar activos por categoría.
* Registrar marcas y modelos.
* Registrar proveedores.
* Registrar ubicaciones.
* Asignar responsables.
* Gestionar garantías.
* Registrar mantenimientos.
* Registrar reparaciones.
* Calcular costos acumulados.
* Programar próximos mantenimientos.
* Generar códigos QR.
* Consultar información mediante QR.
* Adjuntar documentos.
* Adjuntar fotografías.
* Generar alertas.
* Mostrar estadísticas.
* Gestionar usuarios y permisos.

STACK

React.ts
Node.js con Hono o Next
Postgress
Docker
Drizzle ORM
Better Auth
React Hook Form
TanStack Query
Shadcn/ui
Zustand
