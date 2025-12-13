/* --- INICIA CÓDIGO JS (clientes.js) --- */
const API_URL = "api/";

// Elementos
let formCliente, btnCancelarCliente;
let inputClienteID, tablaClientesBody;
let inputClienteNombre, inputClienteApellido, inputClienteTelefono, inputClienteEmail, inputClienteDireccion;
let modalHistorial; 

document.addEventListener('DOMContentLoaded', () => {
    
    formCliente = document.getElementById('form-cliente');
    btnCancelarCliente = document.getElementById('btn-cancelar-cliente');
    inputClienteID = document.getElementById('cliente-id');
    tablaClientesBody = document.getElementById('tabla-clientes-body');
    inputClienteNombre = document.getElementById('cliente-nombre');
    inputClienteApellido = document.getElementById('cliente-apellido');
    inputClienteTelefono = document.getElementById('cliente-telefono');
    inputClienteEmail = document.getElementById('cliente-email');
    inputClienteDireccion = document.getElementById('cliente-direccion');
    
    modalHistorial = document.getElementById('modal-historial');
    
    formCliente.addEventListener('submit', (e) => { e.preventDefault(); guardarOActualizarCliente(); });
    btnCancelarCliente.addEventListener('click', resetFormularioCliente);
    
    cargarClientes(); 
});

// --- FUNCIONES PRINCIPALES ---

async function cargarClientes() {
    console.log("Cargando clientes...");
    try {
        const respuesta = await fetch(API_URL + 'clientes.php');
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            renderClientesTabla(datos.data);
        } else {
            console.error("Error API (cargar clientes):", datos.message);
        }
    } catch (error) { console.error("Error Red (cargar clientes):", error); }
}

function renderClientesTabla(clientes) {
    tablaClientesBody.innerHTML = '';
    clientes.forEach(cliente => {
        
        // Mostrar fecha Y HORA si existe
        let fechaMostrar = "---";
        if (cliente.fecha_registro) {
            // 'toLocaleString' muestra FECHA y HORA (ej: 18/11/2025, 5:30 p.m.)
            fechaMostrar = new Date(cliente.fecha_registro).toLocaleString('es-CO');
        }

        const fila = `
            <tr>
                <td>${cliente.id_cliente}</td>
                <td><small>${fechaMostrar}</small></td> <td>${cliente.nombre}</td>
                <td>${cliente.apellido}</td>
                <td>${cliente.telefono}</td>
                <td>${cliente.email}</td>
                <td>
                    <button onclick="verMotos(${cliente.id_cliente})" style="background-color: green; color: white; margin-bottom:5px; cursor:pointer;">
                        Motos
                    </button>
                    
                    <button onclick="verHistorialOrdenes(${cliente.id_cliente})" style="background-color: #007bff; color: white; margin-bottom:5px; cursor:pointer;">
                        Historial
                    </button>
                    <br>
                    <button onclick="editarCliente(${cliente.id_cliente})">Editar</button>
                    <button onclick="borrarCliente(${cliente.id_cliente}, '${cliente.nombre} ${cliente.apellido}')">Borrar</button>
                </td>
            </tr>`;
        tablaClientesBody.innerHTML += fila;
    });
}

// --- LÓGICA DEL MODAL DE HISTORIAL ---

async function verHistorialOrdenes(idCliente) {
    console.log("Cargando historial para cliente:", idCliente);
    const tbody = document.getElementById('tabla-modal-body');
    tbody.innerHTML = '<tr><td colspan="7">Cargando datos...</td></tr>';
    
    modalHistorial.style.display = "block";

    try {
        const res = await fetch(`${API_URL}ordenes.php?id_cliente=${idCliente}`);
        const data = await res.json();

        if (data.status === 'success') {
            tbody.innerHTML = '';
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">Este cliente no tiene órdenes registradas.</td></tr>';
                return;
            }

            data.data.forEach(orden => {
                const fecha = new Date(orden.fecha_ingreso).toLocaleDateString();
                
                // Detectar Pago
                let estadoPago = orden.estado_pago ? orden.estado_pago.toLowerCase() : '';
                let badgePago = '';

                if (estadoPago === 'pagado') {
                    badgePago = '<span style="color:green; font-weight:bold;">PAGADO ($)</span>';
                } else {
                    badgePago = '<span style="color:red; font-weight:bold;">DEBE</span>';
                }

                const fila = `
                    <tr>
                        <td>${orden.id_orden}</td>
                        <td>${fecha}</td>
                        <td>${orden.placa} (${orden.marca})</td>
                        <td>${orden.estado}</td>
                        <td>${badgePago}</td>
                        <td>$ ${orden.total_orden}</td>
                        <td>
                            <a href="orden_detalle.html?id=${orden.id_orden}" target="_blank" style="background:#eee; padding:3px; text-decoration:none; border:1px solid #ccc;">Ver Detalle</a>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        }
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Error: ${error.message}</td></tr>`;
    }
}

function cerrarModal() {
    modalHistorial.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modalHistorial) {
        modalHistorial.style.display = "none";
    }
}

// --- FUNCIONES CRUD CLIENTE ---

async function guardarOActualizarCliente() {
    const id = inputClienteID.value;
    const esNuevo = (id === '');
    const datosCliente = {
        nombre: inputClienteNombre.value,
        apellido: inputClienteApellido.value,
        telefono: inputClienteTelefono.value,
        email: inputClienteEmail.value,
        direccion: inputClienteDireccion.value
    };
    let url = esNuevo ? (API_URL + 'clientes.php') : (API_URL + `clientes.php?id=${id}`);
    let metodo = esNuevo ? 'POST' : 'PUT';

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosCliente) 
        });
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            cargarClientes();
            resetFormularioCliente();
        } else { alert(datos.message); }
    } catch (error) { console.error(error); }
}

async function editarCliente(id) {
    try {
        const res = await fetch(API_URL + `clientes.php?id=${id}`);
        const datos = await res.json();
        if (datos.status === 'success') {
            const c = datos.data;
            inputClienteNombre.value = c.nombre;
            inputClienteApellido.value = c.apellido;
            inputClienteTelefono.value = c.telefono;
            inputClienteEmail.value = c.email;
            inputClienteDireccion.value = c.direccion;
            inputClienteID.value = c.id_cliente;
            formCliente.querySelector('h3').innerText = 'Editando Cliente';
            formCliente.querySelector('button[type="submit"]').innerText = 'Actualizar';
            btnCancelarCliente.style.display = 'inline';
            window.scrollTo(0, 0);
        }
    } catch (error) { console.error(error); }
}

async function borrarCliente(id, nombre) {
    if (!confirm(`¿Borrar a ${nombre}?`)) return;
    try {
        const res = await fetch(API_URL + `clientes.php?id=${id}`, { method: 'DELETE' });
        const datos = await res.json();
        if (datos.status === 'success') cargarClientes();
        else alert(datos.message);
    } catch (error) { console.error(error); }
}

function resetFormularioCliente() {
    formCliente.reset();
    inputClienteID.value = '';
    formCliente.querySelector('h3').innerText = 'Agregar Cliente';
    formCliente.querySelector('button[type="submit"]').innerText = 'Guardar Cliente';
    btnCancelarCliente.style.display = 'none';
}

function verMotos(idCliente) {
    window.location.href = `motos.html?id_cliente=${idCliente}`;
}