# Política de Seguridad

## Versiones soportadas

| Versión | Soporte de seguridad |
|---|---|
| 1.0.x | ✅ Activo |
| < 1.0 | ❌ Sin soporte |

---

## Reportar una vulnerabilidad

**No abras un issue público para reportar vulnerabilidades de seguridad.**

Si descubres una vulnerabilidad, sigue el proceso de **divulgación responsable**:

### Canal privado

Envía un correo a: **security@exelixitech.com**  
Asunto: `[SECURITY] Auto Casco — <descripción de 5 palabras>`

Incluye:
1. Descripción de la vulnerabilidad
2. Pasos para reproducirla
3. Impacto potencial
4. Posible solución (opcional)
5. Tu nombre / alias para el reconocimiento (opcional)

### Tiempo de respuesta

| Acción | Plazo |
|---|---|
| Acuse de recibo | 48 horas |
| Evaluación inicial | 5 días hábiles |
| Parche en desarrollo | Según severidad (ver abajo) |
| Notificación pública | Tras el parche |

### Severidad y tiempos de parche

| Nivel | Criterio | Plazo de parche |
|---|---|---|
| **Crítico** | RCE, acceso no autorizado a datos | 24–72 horas |
| **Alto** | Exposición de datos sensibles, bypass de auth | 7 días |
| **Medio** | XSS almacenado, CSRF, fuga de información | 30 días |
| **Bajo** | Problemas de configuración, info disclosure menor | 90 días |

---

## Contexto de seguridad del proyecto

### Esta versión es un demo

La versión actual (`v1.0.0`) es una **demostración funcional** con datos en memoria del navegador.

- **No hay backend**: ningún dato se envía a servidores externos.
- **No hay autenticación real**: el login acepta cualquier contraseña no vacía.
- **Los datos son mock**: no se almacena información real de asegurados.

### Consideraciones para producción

Si desplegás este código con backend real, asegurate de implementar:

#### Autenticación y autorización
- JWT con expiración corta (≤ 15 min) + refresh token rotativo
- OAuth2 / OIDC para SSO corporativo
- RBAC estricto: ningún asegurado puede acceder a datos de otro
- Rate limiting en todos los endpoints de autenticación

#### Protección de datos
- HTTPS obligatorio (TLS 1.3 mínimo)
- Cifrado AES-256 en reposo para datos sensibles (fotos, documentos)
- Tokens de sesión en cookies `HttpOnly; Secure; SameSite=Strict`
- CSP (Content Security Policy) estricto
- CORS limitado a dominios autorizados

#### Privacidad
- Minimización de datos: capturar solo lo necesario
- Geolocalización: solicitar permiso explícito, no almacenar en bruto
- Fotos de vehículos: cifrar antes de almacenar, expirar tras peritaje
- Datos biométricos: nunca almacenar, solo verificar localmente

#### Infraestructura
- WAF (Web Application Firewall) frente al servidor
- DDoS protection (Cloudflare)
- Auditoría de accesos con logs inmutables
- Backups cifrados con retención definida

---

## Reconocimientos

Agradecemos a todos los investigadores que reporten vulnerabilidades de forma responsable.  
Los contribuidores de seguridad se listarán aquí (con su permiso).

---

## Contáctanos

- **Seguridad**: security@exelixitech.com
- **General**: joelmis.materano@exelixitech.com
- **Web**: https://exelixitech.com
