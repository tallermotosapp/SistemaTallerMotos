// ============================================
// CLIENTES - VERSIÓN COMPLETA (MARCA, OBS Y LUGAR)
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
    formatearFecha
} from '../firebase-config.js';

let clientesCache = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando módulo de clientes...');
    
    try {
        await verificarAutenticacion();
        console.log('✅ Usuario autenticado');
        mostrarUsuarioActual();
    } catch (error) {
        console.log('❌ No autenticado');
        return;
    }
    
    const formCliente = document.getElementById('form-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');
    
    if (formCliente) {
        formCliente.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarCliente();
        });
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', resetFormulario);
    }
    
    cargarClientesRealTime();
});

// ============================================
// MOSTRAR USUARIO
// ============================================
function mostrarUsuarioActual() {
    const usuario = obtenerUsuarioActual();
    if (usuario) {
        console.log(`👤 Usuario: ${usuario.nombre}`);
    }
}

// ============================================
// CARGAR CLIENTES EN TIEMPO REAL
// ============================================
function cargarClientesRealTime() {
    console.log('📡 Conectando a Firebase...');
    const clientesRef = ref(database, 'clientes');
    
    onValue(clientesRef, (snapshot) => {
        console.log('📥 Datos recibidos de Firebase');
        clientesCache = [];
        const tbody = document.getElementById('tabla-clientes-body');
        
        if (!tbody) {
            console.error('❌ No se encontró tabla-clientes-body');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('✅ Clientes encontrados:', Object.keys(data).length);
            
            Object.keys(data).forEach(key => {
                const cliente = {
                    id: key,
                    ...data[key]
                };
                clientesCache.push(cliente);
            });
            
            clientesCache.sort((a, b) => a.nombre.localeCompare(b.nombre));
            
            clientesCache.forEach(cliente => {
                const fila = crearFilaCliente(cliente);
                tbody.innerHTML += fila;
            });
        } else {
            console.log('ℹ️ No hay clientes en la base de datos');
            // Colspan 10 para cubrir todas las columnas nuevas
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:#999;">No hay clientes registrados. ¡Agrega el primero!</td></tr>';
        }
    }, (error) => {
        console.error('❌ Error al cargar clientes:', error);
        alert('Error al cargar datos: ' + error.message);
    });
}

// ============================================
// CREAR FILA
// ============================================
function crearFilaCliente(cliente) {
    const fechaRegistro = cliente.fecha_registro ? formatearFecha(cliente.fecha_registro) : '---';
    const fechaCita = cliente.fecha_cita || '---';
    const horaCita = cliente.hora_cita || '---';
    
    // Dirección fija para la tabla
    const direccionFija = "Cl 63 #14 -76<br>Cajeto -MotoPro";

    return `
        <tr>
            <td><small>${fechaRegistro}</small></td>
            <td><strong>${cliente.nombre} ${cliente.apellido}</strong></td>
            <td>${cliente.telefono || '---'}</td>
            <td>${cliente.placa || '---'}</td>
            <td>${cliente.marca || '---'}</td>
            <td>${cliente.modelo_moto || '---'}</td>
            
            <td><small style="color:#555; display:block; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${cliente.observacion || ''}">${cliente.observacion || '---'}</small></td>
            
            <td><small style="color:#0D47A1;">${direccionFija}</small></td>
            
            <td>${fechaCita} <br> <small>${horaCita}</small></td>
            
            <td>
                <button onclick="window.editarCliente('${cliente.id}')" class="btn-accion-sm btn-editar">✏️</button>
                <button onclick="window.borrarCliente('${cliente.id}', '${cliente.nombre} ${cliente.apellido}')" class="btn-accion-sm btn-borrar">🗑️</button>
            </td>
        </tr>
    `;
}

// ============================================
// GUARDAR CLIENTE
// ============================================
async function guardarCliente() {
    console.log('💾 Intentando guardar cliente...');
    
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const apellido = document.getElementById('cliente-apellido').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    
    const placa = document.getElementById('cliente-placa').value.trim();
    const marca = document.getElementById('cliente-marca').value.trim(); // NUEVO
    const modeloMoto = document.getElementById('cliente-modelo').value.trim();
    const observacion = document.getElementById('cliente-observacion').value.trim(); // NUEVO
    
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
        marca,          // Se guarda en Firebase
        modelo_moto: modeloMoto,
        observacion,    // Se guarda en Firebase
        fecha_cita: fechaCita,
        hora_cita: horaCita,
        fecha_actualizacion: new Date().toISOString()
    };
    
    console.log('📤 Datos a guardar:', datosCliente);
    
    try {
        if (clienteId) {
            console.log('🔄 Actualizando cliente:', clienteId);
            const clienteRef = ref(database, `clientes/${clienteId}`);
            await update(clienteRef, datosCliente);
            alert('✅ Cliente actualizado correctamente');
        } else {
            console.log('➕ Creando nuevo cliente...');
            const clientesRef = ref(database, 'clientes');
            const nuevoClienteRef = push(clientesRef);
            
            datosCliente.fecha_registro = new Date().toISOString();
            
            await set(nuevoClienteRef, datosCliente);
            
            console.log('✅ Cliente creado con ID:', nuevoClienteRef.key);
            alert('✅ Cliente creado correctamente');
        }
        
        resetFormulario();
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('❌ Error al guardar: ' + error.message);
    }
}

// ============================================
// EDITAR CLIENTE
// ============================================
window.editarCliente = async function(clienteId) {
    console.log('✏️ Editando cliente:', clienteId);
    try {
        const clienteRef = ref(database, `clientes/${clienteId}`);
        const snapshot = await get(clienteRef);
        
        if (snapshot.exists()) {
            const cliente = snapshot.val();
            
            document.getElementById('cliente-nombre').value = cliente.nombre;
            document.getElementById('cliente-apellido').value = cliente.apellido;
            document.getElementById('cliente-telefono').value = cliente.telefono || '';
            
            document.getElementById('cliente-placa').value = cliente.placa || '';
            document.getElementById('cliente-marca').value = cliente.marca || ''; // Cargar Marca
            document.getElementById('cliente-modelo').value = cliente.modelo_moto || '';
            document.getElementById('cliente-observacion').value = cliente.observacion || ''; // Cargar Observación
            
            document.getElementById('cliente-fecha-cita').value = cliente.fecha_cita || '';
            document.getElementById('cliente-hora-cita').value = cliente.hora_cita || '';
            document.getElementById('cliente-id').value = clienteId;
            
            document.querySelector('#form-cliente h3').innerText = '✏️ Editando Cliente';
            document.querySelector('#form-cliente button[type="submit"]').innerText = 'Actualizar Cliente';
            document.getElementById('btn-cancelar-cliente').style.display = 'inline';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('❌ Error:', error);
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
    
    console.log('🗑️ Borrando cliente:', clienteId);
    try {
        const clienteRef = ref(database, `clientes/${clienteId}`);
        await remove(clienteRef);
        
        console.log('✅ Cliente borrado');
        alert('✅ Cliente borrado correctamente');
    } catch (error) {
        console.error('❌ Error:', error);
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
    document.querySelector('#form-cliente button[type="submit"]').innerText = '💾 Guardar Cliente';
    document.getElementById('btn-cancelar-cliente').style.display = 'none';
}

console.log('✅ Módulo de clientes cargado');
