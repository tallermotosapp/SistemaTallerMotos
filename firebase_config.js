// clientes.js
import {
    database,
    ref,
    push,
    set,
    get,
    update,
    remove,
    onValue
} from './firebase_config.js';

let formCliente, btnCancelarCliente;
let inputClienteID, tablaClientesBody;
let inputClienteNombre, inputClienteApellido, inputClienteTelefono, inputClienteDireccion;
let inputClienteFechaCita, inputClienteHoraCita;

document.addEventListener('DOMContentLoaded', () => {

    formCliente = document.getElementById('form-cliente');
    btnCancelarCliente = document.getElementById('btn-cancelar-cliente');

    inputClienteID = document.getElementById('cliente-id');
    tablaClientesBody = document.getElementById('tabla-clientes-body');

    inputClienteNombre = document.getElementById('cliente-nombre');
    inputClienteApellido = document.getElementById('cliente-apellido');
    inputClienteTelefono = document.getElementById('cliente-telefono');
    inputClienteDireccion = document.getElementById('cliente-direccion');
    inputClienteFechaCita = document.getElementById('cliente-fecha-cita');
    inputClienteHoraCita = document.getElementById('cliente-hora-cita');

    formCliente.addEventListener('submit', e => {
        e.preventDefault();
        guardarOActualizarCliente();
    });

    btnCancelarCliente.addEventListener('click', resetFormularioCliente);

    cargarClientes();
});

/* ========= CARGAR CLIENTES ========= */
function cargarClientes() {
    const clientesRef = ref(database, 'clientes');

    onValue(clientesRef, snapshot => {
        tablaClientesBody.innerHTML = '';

        if (!snapshot.exists()) {
            tablaClientesBody.innerHTML = '<tr><td colspan="7">No hay clientes</td></tr>';
            return;
        }

        const data = snapshot.val();

        Object.entries(data).forEach(([id, c]) => {

            const fecha = c.fechaRegistro
                ? new Date(c.fechaRegistro).toLocaleString('es-CO')
                : '---';

            const cita = c.fechaCita
                ? `${c.fechaCita} ${c.horaCita || ''}`
                : '---';

            tablaClientesBody.innerHTML += `
                <tr>
                    <td>${id}</td>
                    <td>${fecha}</td>
                    <td>${c.nombre}</td>
                    <td>${c.apellido}</td>
                    <td>${c.telefono || ''}</td>
                    <td>${cita}</td>
                    <td>
                        <button onclick="editarCliente('${id}')">Editar</button>
                        <button onclick="borrarCliente('${id}', '${c.nombre} ${c.apellido}')">Borrar</button>
                    </td>
                </tr>
            `;
        });
    });
}

/* ========= GUARDAR / ACTUALIZAR ========= */
async function guardarOActualizarCliente() {

    const id = inputClienteID.value;

    const cliente = {
        nombre: inputClienteNombre.value,
        apellido: inputClienteApellido.value,
        telefono: inputClienteTelefono.value,
        direccion: inputClienteDireccion.value,
        fechaCita: inputClienteFechaCita.value || null,
        horaCita: inputClienteHoraCita.value || null
    };

    if (id) {
        await update(ref(database, `clientes/${id}`), cliente);
    } else {
        cliente.fechaRegistro = new Date().toISOString();
        await push(ref(database, 'clientes'), cliente);
    }

    resetFormularioCliente();
}

/* ========= EDITAR ========= */
window.editarCliente = async function (id) {
    const snapshot = await get(ref(database, `clientes/${id}`));
    if (!snapshot.exists()) return;

    const c = snapshot.val();

    inputClienteNombre.value = c.nombre;
    inputClienteApellido.value = c.apellido;
    inputClienteTelefono.value = c.telefono || '';
    inputClienteDireccion.value = c.direccion || '';
    inputClienteFechaCita.value = c.fechaCita || '';
    inputClienteHoraCita.value = c.horaCita || '';

    inputClienteID.value = id;

    formCliente.querySelector('h3').innerText = 'Editando Cliente';
    formCliente.querySelector('button[type="submit"]').innerText = 'Actualizar';
    btnCancelarCliente.style.display = 'inline';
};

/* ========= BORRAR ========= */
window.borrarCliente = async function (id, nombre) {
    if (!confirm(`¿Borrar a ${nombre}?`)) return;
    await remove(ref(database, `clientes/${id}`));
};

/* ========= RESET ========= */
function resetFormularioCliente() {
    formCliente.reset();
    inputClienteID.value = '';
    formCliente.querySelector('h3').innerText = 'Agregar Cliente';
    formCliente.querySelector('button[type="submit"]').innerText = 'Guardar Cliente';
    btnCancelarCliente.style.display = 'none';
}
