// ============================================
// CLIENTES - VERSIÓN FIREBASE (CORREGIDA)
// ============================================

import { 
    database, 
    ref, 
    set, 
    get, 
    push, 
    remove, 
    update,
    onValue,
    verificarAutenticacion,
    obtenerUsuarioActual,
    formatearFecha,
    cerrarSesion
} from '../firebase-config.js';

// Variables globales
let clientesCache = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticación
    try {
        await verificarAutenticacion();
        mostrarUsuarioActual();
    } catch (error) {
        console.log('No autenticado, redirigiendo...');
        return;
    }
    
    // Elementos del DOM
    const formCliente = document.getElementById('form-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');
    
    // Event Listeners
    formCliente.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarCliente();
    });
    
    btnCancelar.addEventListener('click', resetFormulario);
    
    // Cargar clientes en tiempo real
    cargarClientesRealTime();
});

// ============================================
// MOSTRAR USUARIO ACTUAL
// ============================================
function mostrarUsuarioActual() {
    const usuario = obtenerUsuarioActual();
    if (usuario) {
        console.log(`✅ Usuario: ${usuario.nombre} (${usuario.rol})`);
    }
}

// ============================================
// CARGAR CLIENTES EN TIEMPO REAL
// ============================================
function cargarClientesRealTime() {
    const clientesRef = ref(database, 'clientes');
    
    onValue(clientesRef, (snapshot) => {
        clientesCache = [];
        const tbody = document.getElementById('tabla-clientes-body');
        tbody.innerHTML = '';
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // Convertir objeto a array
            Object.keys(data).forEach(key => {
                const cliente = {
                    id: key,
                    ...data[key]
                };
                clientesCache.push(cliente);
            });
            
            // Ordenar por nombre
            clientesCache.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            // Renderizar tabla
            clientesCache.forEach(cliente => {
                const fila = crearFilaCliente(cliente);
                tbody.innerHTML += fila;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#999;">No hay clientes registrados. Agrega el primero.</td></tr>';
        }
    }, (error) => {
        console.error('❌ Error al cargar clientes:', error);
        alert('Error al cargar datos. Verifica tu conexión a Firebase.');
    });
}

// ============================================
// CREAR FILA DE CLIENTE
// ============================================
function crearFilaCliente(cliente) {
    const fechaRegistro = cliente.fecha_registro ? formatearFecha(cliente.fecha_registro) : '---';
    const fechaCita = cliente.fecha_cita || '---';
    const horaCita = cliente.hora_cita || '---';
    
    return `
        <tr>
            <td><small>${fechaRegistro}</small></td>
            <td><strong>${cliente.nombre} ${cliente.apellido}</strong></td>
            <td>${cliente.telefono || '---'}</td>
            <td>${cliente.placa || '---'}</td>
            <td>${cliente.modelo_moto || '---'}</td>
            <td>${fechaCita}</td>
            <td>${horaCita}</td>
            <td>
                <button onclick="window.editarCliente('${cliente.id}')" style="background-color: #2196F3;">✏️ Editar</button>
                <button onclick="window.borrarCliente('${cliente.id}', '${cliente.nombre} ${cliente.apellido}')" style="background-color: #f44336;">🗑️ Borrar</button>
            </td>
        </tr>
    `;
}

// ============================================
// GUARDAR CLIENTE (CORREGIDO)
// ============================================
async function guardarCliente() {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const apellido = document.getElementById('cliente-apellido').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const placa = document.getElementById('cliente-placa').value.trim();
    const modeloMoto = document.getElementById('cliente-modelo').value.trim();
    const fechaCita = document.getElementById('cliente-fecha-cita').value;
    const horaCita = document.getElementById('cliente-hora-cita').value;
    const clienteId = document.getElementById('cliente-id').value;
    
    if (!nombre || !apellido) {
        alert('⚠️ Nombre y apellido son obligatorios');
        return;
    }
    
    const datosCliente = {
        nombre,
        apellido,
        telefono,
        placa,
        modelo_moto: modeloMoto,
        fecha_cita: fechaCita,
        hora_cita: horaCita,
        fecha_actualizacion: new Date().toISOString()
    };
    
    try {
        if (clienteId) {
            // ACTUALIZAR cliente existente
            const clienteRef = ref(database, `clientes/${clienteId}`);
            await update(clienteRef, datosCliente);
            alert('✅ Cliente actualizado correctamente');
        } else {
            // CREAR nuevo cliente
            const clientesRef = ref(database, 'clientes');
            const nuevoClienteRef = push(clientesRef);
            
            datosCliente.fecha_registro = new Date().toISOString();
            
            await set(nuevoClienteRef, datosCliente);
            
            alert('✅ Cliente creado correctamente');
        }
        
        resetFormulario();
    } catch (error) {
        console.error('❌ Error al guardar cliente:', error);
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ============================================
// EDITAR CLIENTE
// ============================================
window.editarCliente = async function(clienteId) {
    try {
        const clienteRef = ref(database, `clientes/${clienteId}`);
        const snapshot = await get(clienteRef);
        
        if (snapshot.exists()) {
            const cliente = snapshot.val();
            
            document.getElementById('cliente-nombre').value = cliente.nombre;
            document.getElementById('cliente-apellido').value = cliente.apellido;
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            document.getElementById('cliente-placa').value = cliente.placa || '';
            document.getElementById('cliente-modelo').value = cliente.modelo_moto || '';
            document.getElementById('cliente-fecha-cita').value = cliente.fecha_cita || '';
            document.getElementById('cliente-hora-cita').value = cliente.hora_cita || '';
            document.getElementById('cliente-id').value = clienteId;
            
            document.querySelector('#form-cliente h3').innerText = '✏️ Editando Cliente';
            document.querySelector('#form-cliente button[type="submit"]').innerText = 'Actualizar Cliente';
            document.getElementById('btn-cancelar-cliente').style.display = 'inline';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('❌ Error al cargar cliente:', error);
        alert('Error al cargar datos del cliente');
    }
}

// ============================================
// BORRAR CLIENTE
// ============================================
window.borrarCliente = async function(clienteId, nombreCompleto) {
    if (!confirm(`¿Estás seguro de borrar a ${nombreCompleto}?`)) {
        return;
    }
    
    try {
        const clienteRef = ref(database, `clientes/${clienteId}`);
        await remove(clienteRef);
        
        alert('✅ Cliente borrado correctamente');
    } catch (error) {
        console.error('❌ Error al borrar cliente:', error);
        alert('❌ Error al borrar: ' + error.message);
    }
}

// ============================================
// RESET FORMULARIO
// ============================================
function resetFormulario() {
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id').value = '';
    document.querySelector('#form-cliente h3').innerText = 'Agregar Cliente';
    document.querySelector('#form-cliente button[type="submit"]').innerText = 'Guardar Cliente';
    document.getElementById('btn-cancelar-cliente').style.display = 'none';
}

console.log('✅ Módulo de Clientes cargado correctamente');
