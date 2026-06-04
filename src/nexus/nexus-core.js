/**
 * nexus-core.js — Núcleo NexusGuard para auto-casa-inspeccion
 * Lee ?nexus_token= de la URL y verifica con el servidor Nexus.
 */

/**
 * Verifica el token de acceso contra Nexus.
 * @param {string} nexusApiUrl  URL base del servidor Nexus
 * @returns {Promise<{active: boolean, empresa?: object, submodulo?: object, reason?: string}>}
 */
const STORAGE_KEY = 'nexus_access_token';

export async function verifyNexusAccess(nexusApiUrl) {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('nexus_token');

  // Si viene en la URL, guardarlo en sessionStorage para persistir recargas
  if (tokenFromUrl) {
    sessionStorage.setItem(STORAGE_KEY, tokenFromUrl);
  }

  // Leer de sessionStorage si no viene en la URL
  const token = tokenFromUrl || sessionStorage.getItem(STORAGE_KEY);

  if (!token) {
    return {
      active: false,
      reason: 'No se proporcionó token de acceso. Contacte a su administrador.',
    };
  }

  try {
    const res = await fetch(`${nexusApiUrl.replace(/\/$/, '')}/api/access/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (data.active) {
      return { active: true, empresa: data.empresa, submodulo: data.submodulo };
    }

    return { active: false, reason: data.reason ?? 'Servicio no disponible para esta empresa.' };
  } catch {
    return { active: false, reason: 'No se pudo conectar con el servidor de autorización.' };
  }
}
