const API_URL = "api/";

// Elementos
let formInventario, btnCancelarInventario, tablaInventarioBody, filtroInput;
let inputInvID, inputInvSku, inputInvNombre, inputInvDescripcion, inputInvCategoria, inputInvPrecio, inputInvStock;
let inventarioCompleto = []; // Para filtrar rápido

document.addEventListener('DOMContentLoaded', () => {
    formInventario = document.getElementById('form-inventario');
    btnCancelarInventario = document.getElementById('btn-cancelar-inventario');
    tablaInventarioBody = document.getElementById('tabla-inventario-body');
    filtroInput = document.getElementById('filtro-busqueda');
    
    inputInvID = document.getElementById('inv-id');
    inputInvSku = document.getElementById('inv-sku');
    inputInvNombre = document.getElementById('inv-nombre');
    inputInvDescripcion = document.getElementById('inv-descripcion');
    inputInvCategoria = document.getElementById('inv-categoria');
    inputInvPrecio = document.getElementById('inv-precio');
    inputInvStock = document.getElementById('inv-stock');

    formInventario.addEventListener('submit', (e) => { e.preventDefault(); guardarOActualizarItem(); });
    btnCancelarInventario.addEventListener('click', resetFormularioInventario);
    filtroInput.addEventListener('input', filtrarTabla);

    cargarInventario();
});

async function cargarInventario() {
    try {
        const respuesta = await fetch(API_URL + 'inventario.php');
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            inventarioCompleto = datos.data;
            renderInventarioTabla(inventarioCompleto);
        } else {
            alert(datos.message);
        }
    } catch (error) {
        console.error(error);
    }
}

function renderInventarioTabla(lista) {
    tablaInventarioBody.innerHTML = '';
    lista.forEach(item => {
        const fila = `
            <tr>
                <td>${item.codigo_sku}</td>
                <td>${item.nombre_pieza}</td>
                <td>${item.categoria}</td>
                <td>$ ${item.precio_venta}</td>
                <td>${item.stock}</td>
                <td>
                    <button onclick="editarItem(${item.id_repuesto})">Editar</button>
                    <button onclick="borrarItem(${item.id_repuesto}, '${item.nombre_pieza}')">Borrar</button>
                </td>
            </tr>`;
        tablaInventarioBody.innerHTML += fila;
    });
}

function filtrarTabla() {
    const texto = filtroInput.value.toLowerCase();
    const filtrados = inventarioCompleto.filter(item => 
        item.nombre_pieza.toLowerCase().includes(texto) || 
        item.codigo_sku.toLowerCase().includes(texto)
    );
    renderInventarioTabla(filtrados);
}

async function guardarOActualizarItem() {
    const id = inputInvID.value;
    const esNuevo = (id === '');

    const datosItem = {
        codigo_sku: inputInvSku.value,
        nombre_pieza: inputInvNombre.value,
        descripcion: inputInvDescripcion.value,
        categoria: inputInvCategoria.value,
        precio_venta: inputInvPrecio.value ? parseFloat(inputInvPrecio.value) : 0,
        stock: inputInvStock.value ? parseInt(inputInvStock.value) : 0
    };

    let metodo = esNuevo ? 'POST' : 'PUT';
    let url = esNuevo ? (API_URL + 'inventario.php') : (API_URL + `inventario.php?id=${id}`);

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosItem) 
        });
        const datosRespuesta = await respuesta.json();

        if (datosRespuesta.status === 'success') {
            cargarInventario(); 
            resetFormularioInventario();
        } else {
            alert("Error: " + datosRespuesta.message);
        }
    } catch (error) {
        console.error(error);
    }
}

async function editarItem(id) {
    try {
        const respuesta = await fetch(API_URL + `inventario.php?id=${id}`);
        const datos = await respuesta.json();
        if (datos.status === 'success') {
            const item = datos.data;
            inputInvSku.value = item.codigo_sku;
            inputInvNombre.value = item.nombre_pieza;
            inputInvDescripcion.value = item.descripcion;
            inputInvCategoria.value = item.categoria;
            inputInvPrecio.value = item.precio_venta;
            inputInvStock.value = item.stock;
            inputInvID.value = item.id_repuesto;
            
            formInventario.querySelector('h3').innerText = 'Editando Item';
            formInventario.querySelector('button[type="submit"]').innerText = 'Actualizar Item';
            btnCancelarInventario.style.display = 'inline';
            window.scrollTo(0, formInventario.offsetTop);
        }
    } catch (error) { console.error(error); }
}

async function borrarItem(id, nombre) {
    if (!confirm(`¿Borrar ${nombre}?`)) return;
    try {
        const respuesta = await fetch(API_URL + `inventario.php?id=${id}`, { method: 'DELETE' });
        const datos = await respuesta.json();
        if (datos.status === 'success') cargarInventario();
        else alert(datos.message);
    } catch (error) { console.error(error); }
}

function resetFormularioInventario() {
    formInventario.reset();
    inputInvID.value = '';
    formInventario.querySelector('h3').innerText = 'Agregar/Editar Item';
    formInventario.querySelector('button[type="submit"]').innerText = 'Guardar Item';
    btnCancelarInventario.style.display = 'none';
}