// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getDatabase, ref, set, get, push, remove, update, onValue, query, orderByChild } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// PASO 1: CONFIGURACIÓN DE TU PROYECTO
// ============================================
// IMPORTANTE: Reemplaza estos valores con los de TU proyecto de Firebase
// Los obtienes en: Firebase Console > Project Settings > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyCQNql_3npQHhkf3TKqk0jdHNCotwqyFg8",
  authDomain: "tallermotosliz.firebaseapp.com",
  projectId: "tallermotosliz",
  databaseURL:"https://tallermotosliz-default-rtdb.firebaseio.com",
  storageBucket: "tallermotosliz.firebasestorage.app",
  messagingSenderId: "536042405456",
  appId: "1:536042405456:web:6ac1e8251d0685f4735b55",
  measurementId: "G-KP61WQ8VBQ"
};
// ============================================
// INICIALIZAR FIREBASE
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// ============================================
// EXPORTAR PARA USO EN OTROS ARCHIVOS
// ============================================
export { 
    app, 
    auth, 
    database, 
    storage,
    // Funciones de Auth
    onAuthStateChanged,
    signOut,
    // Funciones de Database
    ref,
    set,
    get,
    push,
    remove,
    update,
    onValue,
    query,
    orderByChild,
    // Funciones de Storage
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Verificar si el usuario está autenticado
 * Usar en cada página para protegerla
 */
export function verificarAutenticacion() {
    return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // Usuario autenticado
                resolve(user);
            } else {
                // No autenticado - redirigir a login
                window.location.href = 'login.html';
                reject('No autenticado');
            }
        });
    });
}

/**
 * Obtener datos del usuario actual desde sesión
 */
export function obtenerUsuarioActual() {
    const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

/**
 * Cerrar sesión
 */
export async function cerrarSesion() {
    try {
        await signOut(auth);
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

/**
 * Verificar si el usuario es administrador
 */
export function esAdmin() {
    const user = obtenerUsuarioActual();
    return user && user.rol === 'admin';
}

/**
 * Generar ID único
 */
export function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatear fecha para Colombia
 */
export function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-CO', opciones);
}

/**
 * Formatear moneda colombiana
 */
export function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// ============================================
// CONFIGURACIÓN DEL TALLER (Editable)
// ============================================
export const CONFIG_TALLER = {
    nombre: "Sistema de Taller", // Cambiar cuando tengas el nombre
    telefono: "", // Agregar después
    direccion: "", // Agregar después
    email: "contacto@taller.com",
    horario: "Lun-Vie: 8:00 AM - 6:00 PM, Sáb: 8:00 AM - 2:00 PM",
    
    // Configuración de recordatorios
    recordatorios: {
        diasAntes: 3, // Enviar recordatorio 3 días antes
        horaEnvio: "09:00", // Hora de envío de recordatorios
        mensajeTemplate: "Hola {nombre}, te recordamos que tienes una cita el {fecha} a las {hora}. ¡Te esperamos!"
    },
    
    // Configuración de WhatsApp
    whatsapp: {
        activo: true,
        numeroTaller: "573001234567", // Cambiar por tu número
        mensajeBienvenida: "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?"
    },
    
    // Configuración de TV
    tv: {
        actualizacionMinutos: 5,
        sonidoActivo: true,
        sonidoUrl: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
    }
};

// ============================================
// INICIALIZAR DATOS DE PRUEBA (Solo primera vez)
// ============================================
export async function inicializarDatosPrueba() {
    try {
        const dbRef = ref(database, 'configuracion/inicializado');
        const snapshot = await get(dbRef);
        
        if (!snapshot.exists()) {
            console.log('Inicializando datos de prueba...');
            
            // Crear estructura de datos básica
            await set(ref(database, 'configuracion'), {
                inicializado: true,
                version: '1.0.0',
                fechaInstalacion: new Date().toISOString()
            });
            
            console.log('Sistema inicializado correctamente');
        }
    } catch (error) {
        console.error('Error al inicializar datos:', error);
    }
}

// ============================================
// LOGS DEL SISTEMA (Opcional)
// ============================================
export async function registrarLog(accion, detalles) {
    try {
        const usuario = obtenerUsuarioActual();
        const logRef = push(ref(database, 'logs'));
        
        await set(logRef, {
            fecha: new Date().toISOString(),
            usuario: usuario ? usuario.username : 'Sistema',
            accion: accion,
            detalles: detalles
        });
    } catch (error) {
        console.error('Error al registrar log:', error);
    }
}

console.log('🔥 Firebase configurado correctamente');
