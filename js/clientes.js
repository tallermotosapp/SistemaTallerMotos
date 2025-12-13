// js/clientes.js
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

// =======================
// VARIABLES
// =======================
let formCliente, btnCancelarCliente;
let inputClienteID, tablaClientesBody;
let nombre, apellido, telefono, direccion;
let fechaCita, horaCita;

// =======================
// INICIO
// =======================
document.addEventListener('DOMContentLoaded', () => {

  formCliente = document.getElementById('form-cliente');
  btnCancelarCliente = document.getElementById('btn-cancelar-cliente');

  inputClienteID = document.getElementById('cliente-id');
  tablaClientesBody = document.getElementById('tabla-clientes-body');

  nombre = document.getElementById('cliente-nombre');
  apellido = document.getElementById('cliente-apellido');
  telefono = document.getElementById('cliente-telefono');
  direccion = document.getElementById('cliente-direccion');

  fechaCita = document.getElementById('cliente-fecha-cita');
  horaCita = document.getElementById('cliente-hora-cita');

  formCliente.addEventListener('submit', e => {
    e.preventDefault();
    guardarCliente();
  });

  btnCancelarCliente.addEventListener('click', limpiarFormulario);

  cargarClientes();
});

// =======================
// GUARDAR CLIENTE
// =======================
async function guardarCliente() {

  const id = inputClienteID.value;

  const cliente = {
    nombre: nombre.value,
    apellido: apellido.value,
    telefono: telefono.value,
    direccion: direccion.value,
    fechaCita: fechaCita.value,
    horaCita: horaCita.value
  };

  if (id) {
    await update(ref(database, `clientes/${id}`), cliente);
  } else {
    cliente.fechaRegistro = new Date().toISOString();
    await push(ref(database, 'clientes'), cliente);
  }

  limpiarFormulario();
}

// =======================
// CARGAR CLIENTES
// =======================
function cargarClientes() {
  const clientesRef = ref(database, 'clientes');

  onValue(clientesRef, snapshot => {

    tablaClientesBody.innerHTML = '';

    if (!snapshot.exists()) {
      tablaClientesBody.innerHTML =
        '<tr><td colspan="7">No hay clientes</td></tr>';
      return;
    }

    const clientes = snapshot.val();

    Object.entries(clientes).forEach(([id, c]) => {

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

// =======================
// EDITAR
// =======================
window.editarCliente = async function (id) {

  const snapshot = await get(ref(database, `clientes/${id}`));
  if (!snapshot.exists()) return;

  const c = snapshot.val();

  nombre.value = c.nombre;
  apellido.value = c.apellido;
  telefono.value = c.telefono || '';
  direccion.value = c.direccion || '';
  fechaCita.value = c.fechaCita || '';
  horaCita.value = c.horaCita || '';

  inputClienteID.value = id;
  btnCancelarCliente.style.display = 'inline';
};

// =======================
// BORRAR
// =======================
window.borrarCliente = async function (id, nombre) {
  if (!confirm(`¿Borrar a ${nombre}?`)) return;
  await remove(ref(database, `clientes/${id}`));
};

// =======================
// LIMPIAR
// =======================
function limpiarFormulario() {
  formCliente.reset();
  inputClienteID.value = '';
  btnCancelarCliente.style.display = 'none';
}
