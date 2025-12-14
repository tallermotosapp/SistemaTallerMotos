// ============================================
// CLIENTES - VERSIÓN FIREBASE
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
} from './firebase-config.js';

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
        return; // Redirige a login automáticamente
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
        console.log(`Usuario: ${usuario.nombre} (${usuario.rol})`);
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
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">No hay clientes registrados. Agrega el primero.</td></tr>';
        }
    }, (error) => {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar datos. Verifica tu conexión.');
    });
}

// ============================================
// CREAR FILA DE CLIENTE
// ============================================
function crearFilaCliente(cliente) {
    const fecha = cliente.fecha_registro ? formatearFecha(cliente.fecha_registro) : '---';
    
    return `
        <tr>
            <td>${cliente.id.substring(0, 8)}...</td>
            <td><small>${fecha}</small></td>
            <td>${cliente.nombre}</td>
            <td>${cliente.apellido}</td>
            <td>${cliente.telefono || '---'}</td>
            <td>${cliente.email || '---'}</td>
            <td>
                <button onclick="window.verMotos('${cliente.id}')" style="background-color: #4CAF50; color: white; margin-bottom:5px;">
                    🏍️ Motos
                </button>
                <button onclick="window.verHistorialOrdenes('${cliente.id}')" style="background-color: #2196F3; color: white; margin-bottom:5px;">
                    📋 Historial
                </button>
                <br>
                <button onclick="window.editarCliente('${cliente.id}')">✏️ Editar</button>
                <button onclick="window.borrarCliente('${cliente.id}', '${cliente.nombre} ${cliente.apellido}')" style="background-color: #f44336; color: white;">🗑️ Borrar</button>
            </td>
        </tr>
    `;
}

// ============================================
// GUARDAR CLIENTE
// ============================================
async function guardarCliente() {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const apellido = document.getElementById('cliente-apellido').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const email = document.getElementById('cliente-email').value.trim();
    const direccion = document.getElementById('cliente-direccion').value.trim();
    const clienteId = document.getElementById('cliente-id').value;
    
    if (!nombre || !apellido) {
        alert('Nombre y apellido son obligatorios');
        return;
    }
    
    const datosCliente = {
        nombre,
        apellido,
        telefono,
        email,
        direccion,
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
        console.error('Error al guardar cliente:', error);
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
            document.getElementById('cliente-email').value = cliente.email || '';
            document.getElementById('cliente-direccion').value = cliente.direccion || '';
            document.getElementById('cliente-id').value = clienteId;
            
            document.querySelector('#form-cliente h3').innerText = '✏️ Editando Cliente';
            document.querySelector('#form-cliente button[type="submit"]').innerText = 'Actualizar Cliente';
            document.getElementById('btn-cancelar-cliente').style.display = 'inline';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al cargar cliente:', error);
        alert('Error al cargar datos del cliente');
    }
}

// ============================================
// BORRAR CLIENTE
// ============================================
window.borrarCliente = async function(clienteId, nombreCompleto) {
    if (!confirm(`¿Estás seguro de borrar a ${nombreCompleto}?\n\n⚠️ Esto también borrará sus motos y órdenes asociadas.`)) {
        return;
    }
    
    try {
        // Borrar cliente
        const clienteRef = ref(database, `clientes/${clienteId}`);
        await remove(clienteRef);
        
        // TODO: Borrar motos y órdenes asociadas (lo haremos en el siguiente módulo)
        
        alert('✅ Cliente borrado correctamente');
    } catch (error) {
        console.error('Error al borrar cliente:', error);
        alert('❌ Error al borrar: ' + error.message);
    }
}

// ============================================
// VER MOTOS
// ============================================
window.verMotos = function(clienteId) {
    window.location.href = `motos.html?id_cliente=${clienteId}`;
}

// ============================================
// VER HISTORIAL DE ÓRDENES
// ============================================
window.verHistorialOrdenes = async function(clienteId) {
    const modal = document.getElementById('modal-historial');
    const tbody = document.getElementById('tabla-modal-body');
    
    modal.style.display = 'block';
    tbody.innerHTML = '<tr><td colspan="7">Cargando...</td></tr>';
    
    try {
        // Buscar todas las órdenes de este cliente
        const ordenesRef = ref(database, 'ordenes');
        const snapshot = await get(ordenesRef);
        
        tbody.innerHTML = '';
        
        if (snapshot.exists()) {
            const ordenes = [];
            const data = snapshot.val();
            
            // Filtrar órdenes de este cliente
            for (let ordenId in data) {
                const orden = data[ordenId];
                if (orden.id_cliente === clienteId) {
                    ordenes.push({
                        id: ordenId,
                        ...orden
                    });
                }
            }
            
            if (ordenes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">Este cliente no tiene órdenes registradas.</td></tr>';
                return;
            }
            
            // Ordenar por fecha (más reciente primero)
            ordenes.sort((a, b) => new Date(b.fecha_ingreso) - new Date(a.fecha_ingreso));
            
            // Renderizar
            ordenes.forEach(orden => {
                const fecha = formatearFecha(orden.fecha_ingreso);
                const badgePago = orden.estado_pago === 'Pagado' 
                    ? '<span style="color:green; font-weight:bold;">✅ PAGADO</span>'
                    : '<span style="color:red; font-weight:bold;">❌ PENDIENTE</span>';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${orden.id.substring(0, 8)}...</td>
                        <td>${fecha}</td>
                        <td>${orden.placa || '---'}</td>
                        <td><span style="background:#e3f2fd; padding:5px 10px; border-radius:5px;">${orden.estado}</span></td>
                        <td>${badgePago}</td>
                        <td>$${orden.total_orden || 0}</td>
                        <td>
                            <a href="orden_detalle.html?id=${orden.id}" target="_blank" 
                               style="background:#4CAF50; color:white; padding:5px 10px; text-decoration:none; border-radius:5px;">
                                Ver Detalle
                            </a>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="7">No hay órdenes en el sistema.</td></tr>';
        }
    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="7">Error al cargar historial.</td></tr>';
    }
}

// Cerrar modal
window.cerrarModal = function() {
    document.getElementById('modal-historial').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('modal-historial');
    if (event.target == modal) {
        modal.style.display = 'none';
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

console.log('✅ Módulo de Clientes cargado');
