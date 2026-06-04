// ============================================================
//  config.js — Fuente única de URLs/configuración externa.
//  Centralizar acá evita repetir direcciones en varios archivos:
//  si cambia el backend o una API, se edita SOLO este archivo.
// ============================================================

// Backend Flask de generación de certificados (Render)
export const CERT_API = 'https://plataforma-de-cursos-1-l606.onrender.com'

// API pública de Hacienda CR para consultar nombre por cédula/DIMEX
export const HACIENDA_API = 'https://api.hacienda.go.cr/fe/ae'
