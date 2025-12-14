// ============================================
// REDIRECT HANDLER
// Maneja las redirecciones automáticas
// ============================================

// Verificar si hay sesión activa
const haySession = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');

// Obtener la página actual
const paginaActual = window.location.pathname;

// ============================================
// LÓGICA DE REDIRECCIÓN
// ============================================

if (paginaActual === '/' || paginaActual.endsWith('/index.html') || paginaActual.includes('index.html')) {
    // Estamos en index.html
    if (!haySession) {
        // NO hay sesión → Redirigir a login
        window.location.replace('login.html');
    }
    // SI hay sesión → Quedarse en index
} else if (paginaActual.includes('login')) {
    // Estamos en login.html
    if (haySession) {
        // SÍ hay sesión → Redirigir a index
        window.location.replace('index.html');
    }
    // NO hay sesión → Quedarse en login
}

// Para todas las demás páginas, se verificará con Firebase en cada una
