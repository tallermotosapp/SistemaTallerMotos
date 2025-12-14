// ============================================
// CONFIGURACIÓN DE FIREBASE - VERSIÓN CORRECTA
// ============================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getDatabase, ref, set, get, push, remove, update, onValue, query, orderByChild } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

// ============================================
// TU CONFIGURACIÓN DE FIREBASE
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyCQNql_3npQHhkf3TKqk0jdHNCotwqyFg8",
  authDomain: "tallermotosliz.firebaseapp.com",
  projectId: "tallermotosliz",
  databaseURL: "https://tallermotosliz-default-rtdb.firebaseio.com",
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
// EXPORTAR TODO
// ============================================
export { 
    app, 
    auth, 
    database, 
    storage,
    onAuthStateChanged,
    signOut,
    ref,
    set,
    get,
    push,
    remove,
    update,
    onValue,
    query,
    orderByChild,
    storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
};

// ============================================
// VERIFICAR AUTENTICACIÓN
// ============================================
export function verificarAutenticacion() {
    return new Promise((resolve, reject) => {
        const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
        
        if (!session) {
            window.location.href = 'login.html';
            reject('No autenticado');
            return;
        }
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                resolve(user);
            } else {
                window.location.href = 'login.html';
                reject('No autenticado');
            }
        });
    });
}

// ============================================
// OBTENER USUARIO ACTUAL
// ============================================
export function obtenerUsuarioActual() {
    const session = localStorage.getItem('userSession') || sessionStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
}

// ============================================
// CERRAR SESIÓN (CORREGIDO)
// ============================================
export async function cerrarSesion() {
    try {
        await signOut(auth);
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Forzar limpieza y redirect
        localStorage.removeItem('userSession');
        sessionStorage.removeItem('userSession');
        window.location.href = 'login.html';
    }
}

// ============================================
// FORMATEAR FECHA
// ============================================
export function formatearFecha(fecha) {
    if (!fecha) return '---';
    const opciones = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-CO', opciones);
}

// ============================================
// FORMATEAR MONEDA
// ============================================
export function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

console.log('✅ Firebase inicializado correctamente');
