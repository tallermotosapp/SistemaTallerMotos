const API_URL = "api/";
let ID_CLIENTE_ACTUAL = null;

// Elementos del DOM
let formMoto, inputMotoID, tablaMotosBody;
let inputMotoPlaca, inputMotoMarca, inputMotoModelo, inputMotoAnio, inputMotoColor, inputMotoCilindrada;
let btnCancelarMoto, formMotoTitulo, formMotoBtn;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener ID del cliente de la URL
    const params = new URLSearchParams(window.location.search);
    if (!params.has('id_cliente')) {
        alert("Error: No se especificó un cliente.");
        window.location.href = 'clientes.html';
        return;
    }
    ID_CLIENTE_ACTUAL = params.get('id_cliente');

    // 2. Capturar elementos
    formMoto = document.getElementById('form-moto');
    inputMotoID = document.getElementById('moto-id');
    tablaMotosBody = document.getElementById('tabla-motos-body');
    inputMotoPlaca = document.getElementById('moto-placa');
    inputMotoMarca = document.getElementById('moto-marca');
    inputMotoModelo = document.getElementById('moto-modelo');
    inputMotoAnio = document.getElementById('moto-anio');
    inputMotoColor = document.getElementById('moto-color');
    inputMotoCilindrada = document.getElementById('moto-cilindrada');
    btnCancelarMoto = document.getElementById('btn-cancelar-moto');
    formMotoTitulo = formMoto.querySelector('h3');
    formMotoBtn = formMoto.querySelector('button[type="submit"]');

    // 3. Listeners
    formMoto.addEventListener('submit', (e) => { e.preventDefault(); guardarOActualizarMoto(); });
    btnCancelarMoto.addEventListener('click', resetFormularioMoto);

    // 4. Cargar datos
    cargarInfoCliente();
    cargarMotosDelCliente();
});

async function cargarInfoCliente() {
    try {
        // Usamos el API de clientes para obtener el nombre
        const res = await fetch(`${API_URL}clientes.php?id=${ID_CLIENTE_ACTUAL}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const cliente = data.data;
            document.getElementById('nombre-cliente-titulo').innerText = `${cliente.nombre} ${cliente.apellido}`;
            document.getElementById('id-cliente-display').innerText = cliente.id_cliente;
            
            // Mostrar la interfaz
            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('info-cliente-container').style.display = 'block';
            document.getElementById('seccion-motos').style.display = 'block';
        } else {
            alert("Cliente no encontrado.");
            window.location.href = 'clientes.html';
        }
    } catch (error) {
        console.error(error);
        alert("Error cargando cliente.");
    }
}

async function cargarMotosDelCliente() {
    try {
        // Pedimos TODAS las motos y filtramos en JS
        const res = await fetch(API_URL + 'motos.php');
        const data = await res.json();
        
        if (data.status === 'success') {
            // --- ¡¡AQUÍ ESTABA EL ERROR!! ---
            // Antes decía: m.id_cliente_fk
            // Debe decir: m.id_cliente (porque así viene del JOIN de la base de datos)
            
            const motosFiltradas = data.data.filter(m => m.id_cliente == ID_CLIENTE_ACTUAL);
            
            renderMotosTabla(motosFiltradas);
        }
    } catch (error) {
        console.error(error);
    }
}
function renderMotosTabla(motos) {
    tablaMotosBody.innerHTML = '';
    if (motos.length === 0) {
        tablaMotosBody.innerHTML = '<tr><td colspan="4">Este cliente no tiene motos registradas.</td></tr>';
        return;
    }

    motos.forEach(moto => {
        const fila = `
            <tr>
                <td>${moto.placa}</td>
                <td>${moto.marca}</td>
                <td>${moto.modelo}</td>
                <td>
                    <button onclick="irAOrdenes(${moto.id_moto})" style="background-color: orange; color: black;">
                        Ver Órdenes
                    </button>
                    
                    <button onclick="editarMoto(${moto.id_moto})">Editar</button>
                    <button onclick="borrarMoto(${moto.id_moto})">Borrar</button>
                </td>
            </tr>`;
        tablaMotosBody.innerHTML += fila;
    });
}

async function guardarOActualizarMoto() {
    const id = inputMotoID.value;
    const esNuevo = (id === '');
    
    const datosMoto = {
        placa: inputMotoPlaca.value,
        marca: inputMotoMarca.value,
        modelo: inputMotoModelo.value,
        anio: inputMotoAnio.value ? parseInt(inputMotoAnio.value) : null,
        color: inputMotoColor.value,
        cilindrada: inputMotoCilindrada.value ? parseInt(inputMotoCilindrada.value) : null,
        id_cliente_fk: ID_CLIENTE_ACTUAL // ¡Usamos el ID de la URL!
    };

    let metodo = esNuevo ? 'POST' : 'PUT';
    let url = esNuevo ? (API_URL + 'motos.php') : (API_URL + `motos.php?id=${id}`);

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosMoto) 
        });
        const datosRespuesta = await respuesta.json();

        if (datosRespuesta.status === 'success') {
            cargarMotosDelCliente(); 
            resetFormularioMoto();
        } else {
            alert("Error: " + datosRespuesta.message);
        }
    } catch (error) {
        console.error(error);
    }
}

async function editarMoto(id) {
    try {
        const respuesta = await fetch(API_URL + `motos.php?id=${id}`);
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            const moto = datos.data;
            inputMotoPlaca.value = moto.placa;
            inputMotoMarca.value = moto.marca;
            inputMotoModelo.value = moto.modelo;
            inputMotoAnio.value = moto.anio;
            inputMotoColor.value = moto.color;
            inputMotoCilindrada.value = moto.cilindrada;
            inputMotoID.value = moto.id_moto;
            
            formMotoTitulo.innerText = 'Editando Moto';
            formMotoBtn.innerText = 'Actualizar Moto';
            btnCancelarMoto.style.display = 'inline';
        }
    } catch (error) {
        console.error(error);
    }
}

async function borrarMoto(id) {
    
    try {
        const respuesta = await fetch(API_URL + `motos.php?id=${id}`, { method: 'DELETE' });
        const datos = await respuesta.json(); // Aquí guardamos en 'datos'

        // --- ¡¡AQUÍ ESTABA EL ERROR!! ---
        // Antes decía: if (datosRespuesta.status === 'success') ...
        // Ahora debe decir: if (datos.status === 'success') ...
        
        if (datos.status === 'success') {
            // Si fue exitoso, recargamos la lista AUTOMÁTICAMENTE
            cargarMotosDelCliente();
        } else {
            alert("Error: " + datos.message);
        }
    } catch (error) {
        console.error(error);
    }
}

function resetFormularioMoto() {
    formMoto.reset();
    inputMotoID.value = '';
    formMotoTitulo.innerText = 'Agregar Moto a este Cliente';
    formMotoBtn.innerText = 'Guardar Moto';
    btnCancelarMoto.style.display = 'none';
}

// --- PEGA ESTO AL FINAL DE TU ARCHIVO js/motos.js ---

function irAOrdenes(idMoto) {
    // Redirige a la página de órdenes, enviando el ID de la moto
    window.location.href = `ordenes.html?id_moto=${idMoto}`;
}