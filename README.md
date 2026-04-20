# 🚀 SyncData Queue: Sistema ETL Asíncrono

> **⚠️ Estado del Proyecto: En Desarrollo (Work In Progress)**
> *Actualmente se encuentra finalizada la Fase 1 (Core de validación síncrona y seguridad). La arquitectura basada en eventos y colas se encuentra en desarrollo activo.*

## Descripción del Proyecto

Este sistema es una solución backend y frontend diseñada para la ingesta masiva de datos estructurados. 

A diferencia de una carga tradicional (donde el cliente envía el archivo, el servidor procesa línea por línea y bloquea la respuesta), este proyecto implementa una **Arquitectura Basada en Eventos**. Esto permite procesar archivos pesados en segundo plano, aislar errores y mantener una experiencia de usuario fluida e ininterrumpida.

## Flujo de Trabajo (Arquitectura)

1. El frontend envía el archivo (`.xlsx` o `.csv`) a la API.
2. La API recibe el archivo y lo almacena temporalmente de forma segura. *(Próximamente: Se delega un "Trabajo" a un Motor de Colas usando Redis + BullMQ).*
3. La API responde inmediatamente al cliente indicando que el archivo está en proceso.
4. En segundo plano (*Background Workers*), el servidor lee el archivo por fragmentos, valida las reglas de negocio de cada fila de manera estricta y ejecuta la persistencia en la base de datos.
5. Simultáneamente, el backend emite eventos (mediante WebSockets) hacia el frontend para actualizar una barra de progreso en vivo.

## Alcance del Proyecto (Scope)

Para mantener el enfoque en la calidad de la arquitectura de procesamiento, se han definido los siguientes límites:

**Incluye:**
* Recepción y validación estricta de archivos.
* Cola de procesamiento asíncrono para grandes volúmenes de datos.
* Feedback visual de progreso en tiempo real.
* Persistencia transaccional de registros exitosos.
* Patrón *Dead Letter Queue* (Tabla de Cuarentena) para aislar registros con errores, permitiendo su corrección y re-inyección desde la interfaz.

**No Incluye:**
* Sistema de usuarios y roles complejos (se asume un único tenant/admin para la demostración).
* Exportación inversa de datos tabulares hacia Excel.
* Despliegue de infraestructura distribuida.

## Stack Tecnológico

* **Lenguaje:** TypeScript
* **Backend:** Node.js, Express
* **Validación & Seguridad:** Zod, Multer
* **Base de Datos:** PostgreSQL (Dockerizado), Prisma ORM
* **Próximamente:** Redis, BullMQ, React/Next.js
