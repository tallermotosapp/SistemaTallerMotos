const API_URL = "api/";
let ID_MOTO_ACTUAL = null;
let ID_CLIENTE_DEL_DUEÑO = null; 

let formOrden, tablaOrdenesBody;
let inputDiagCliente, inputDiagTaller;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('id_moto')) {
        alert("Error: No se especificó una moto.");
        window.location.href = 'clientes.html';
        return;
    }
    ID_MOTO_ACTUAL = params.get('id_moto');

    formOrden = document.getElementById('form-orden');
    tablaOrdenesBody = document.getElementById('tabla-ordenes-body');
    inputDiagCliente = document.getElementById('orden-diag-cliente');
    inputDiagTaller = document.getElementById('orden-diag-taller');

    if(formOrden) {
        formOrden.addEventListener('submit', (e) => { e.preventDefault(); crearOrden(); });
    }

    cargarInfoMoto();
    cargarOrdenesDeLaMoto();
});

async function cargarInfoMoto() {
    try {
        const res = await fetch(`${API_URL}motos.php?id=${ID_MOTO_ACTUAL}`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const moto = data.data;
            document.getElementById('placa-moto-titulo').innerText = moto.placa;
            document.getElementById('marca-modelo-display').innerText = `${moto.marca} ${moto.modelo}`;
            
            ID_CLIENTE_DEL_DUEÑO = moto.id_cliente_fk;
            const linkVolver = document.getElementById('link-volver');
            if(linkVolver) linkVolver.href = `motos.html?id_cliente=${ID_CLIENTE_DEL_DUEÑO}`;

            document.getElementById('loading-msg').style.display = 'none';
            document.getElementById('info-moto-container').style.display = 'block';
            document.getElementById('seccion-ordenes').style.display = 'block';
        } else {
            alert("Moto no encontrada.");
            window.location.href = 'clientes.html';
        }
    } catch (error) { console.error(error); }
}

async function cargarOrdenesDeLaMoto() {
    try {
        const res = await fetch(`${API_URL}ordenes.php`);
        const data = await res.json();
        
        if (data.status === 'success') {
            const placaActual = document.getElementById('placa-moto-titulo').innerText;
            const ordenesFiltradas = data.data.filter(o => o.placa === placaActual);
            renderOrdenesTabla(ordenesFiltradas);
        }
    } catch (error) { console.error(error); }
}

function renderOrdenesTabla(ordenes) {
    tablaOrdenesBody.innerHTML = '';
    if (ordenes.length === 0) {
        tablaOrdenesBody.innerHTML = '<tr><td colspan="6">Esta moto no tiene historial de órdenes.</td></tr>';
        return;
    }

    ordenes.forEach(orden => {
        const fecha = new Date(orden.fecha_ingreso).toLocaleString();
        
        // --- DIAGNÓSTICO (MIRA LA CONSOLA F12 SI FALLA) ---
        console.log(`Orden ${orden.id_orden}: Estado Pago recibido = "${orden.estado_pago}"`);

        // Lógica flexible (convierte a minúsculas para comparar)
        const pagoStr = orden.estado_pago ? orden.estado_pago.toLowerCase() : '';
        const esPagado = (pagoStr === 'pagado');

        const badgePago = esPagado 
            ? '<span style="color:green; font-weight:bold; border:1px solid green; padding:2px; border-radius:4px;">PAGADO ($)</span>' 
            : '<span style="color:red; font-weight:bold; border:1px solid red; padding:2px; border-radius:4px;">DEBE</span>';

        const fila = `
            <tr>
                <td>${orden.id_orden}</td>
                <td>${fecha}</td>
                <td>${orden.diagnostico_cliente || 'Sin descripción'}</td>
                <td>${orden.estado}</td>
                <td>
                    $ ${orden.total_orden} <br>
                    ${badgePago}
                </td>
                <td>
                    <button onclick="irADetalles(${orden.id_orden})" class="btn-detalle" style="background-color:green; color:white; cursor:pointer;">
                        Ver Detalles
                    </button>
                    <button onclick="borrarOrden(${orden.id_orden})">Borrar</button>
                </td>
            </tr>`;
        tablaOrdenesBody.innerHTML += fila;
    });
}

async function crearOrden() {
    const datosOrden = {
        id_moto_fk: ID_MOTO_ACTUAL,
        diagnostico_cliente: inputDiagCliente.value,
        diagnostico_taller: inputDiagTaller.value
    };

    try {
        const respuesta = await fetch(API_URL + 'ordenes.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosOrden) 
        });
        const datosRespuesta = await respuesta.json();

        if (datosRespuesta.status === 'success') {
            const idNuevaOrden = datosRespuesta.id_orden;
            window.location.href = `orden_detalle.html?id=${idNuevaOrden}`;
        } else {
            alert("Error: " + datosRespuesta.message);
        }
    } catch (error) { console.error(error); }
}

async function borrarOrden(id) {
    try {
        const respuesta = await fetch(API_URL + `ordenes.php?id=${id}`, { method: 'DELETE' });
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            cargarOrdenesDeLaMoto();
        } else {
            alert("Error: " + datos.message);
        }
    } catch (error) { console.error(error); }
}

function irADetalles(idOrden) {
    window.location.href = `orden_detalle.html?id=${idOrden}`;
}