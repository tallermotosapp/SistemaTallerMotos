const API_URL = "api/";

let ORDEN_ID_ACTUAL = null;
let inventarioCache = [];

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('id')) {
        alert("Error: No se proporcionó un ID de orden.");
        window.location.href = 'index.html'; 
        return;
    }
    ORDEN_ID_ACTUAL = params.get('id');

    cargarInfoGeneral();
    cargarServicios();
    cargarRepuestosUsados();
    cargarInventarioParaDropdown();

    document.getElementById('form-nuevo-servicio').addEventListener('submit', (e) => {
        e.preventDefault();
        anadirServicio();
    });

    document.getElementById('form-nuevo-repuesto').addEventListener('submit', (e) => {
        e.preventDefault();
        anadirRepuesto();
    });

    // Listener para guardar (Este es el importante)
    document.getElementById('btn-guardar-info').addEventListener('click', guardarCambiosInfo);
    
    document.getElementById('btn-actualizar-total-general').addEventListener('click', actualizarTotalEnBD);
    
    // Listener visual para cambiar color al seleccionar
    const selectPago = document.getElementById('detalle-pago');
    if(selectPago) {
        selectPago.addEventListener('change', cambiarColorPago);
    }
});

// --- FUNCIONES DE CARGA ---

async function cargarInfoGeneral() {
    try {
        const resOrden = await fetch(`${API_URL}ordenes.php?id=${ORDEN_ID_ACTUAL}`);
        const dataOrden = await resOrden.json();
        if (dataOrden.status !== 'success') throw new Error(dataOrden.message);
        
        const resMotos = await fetch(`${API_URL}motos.php`);
        const dataMotos = await resMotos.json();

        const orden = dataOrden.data;
        const moto = dataMotos.data.find(m => m.id_moto == orden.id_moto_fk);

        document.getElementById('detalle-orden-id').innerText = orden.id_orden;
        document.getElementById('detalle-cliente').innerText = moto ? `${moto.nombre} ${moto.apellido}` : 'No encontrado';
        document.getElementById('detalle-moto').innerText = moto ? `${moto.marca} ${moto.modelo} (Placa: ${moto.placa})` : 'No encontrada';
        
        document.getElementById('detalle-diag-cliente').innerText = orden.diagnostico_cliente;
        document.getElementById('detalle-diag-taller').value = orden.diagnostico_taller;
        document.getElementById('detalle-estado').value = orden.estado;
        
        // --- CARGAR PAGO ---
        const selectPago = document.getElementById('detalle-pago');
        if(selectPago) {
            // Si la BD dice "Pagado", ponemos "Pagado". Si no, "Pendiente".
            selectPago.value = orden.estado_pago; 
            cambiarColorPago();
        }

        document.getElementById('gran-total').innerText = `$ ${parseFloat(orden.total_orden).toFixed(2)}`;

    } catch (error) {
        console.error("Error:", error);
        alert("Error cargando datos: " + error.message);
    }
}

async function cargarServicios() {
    try {
        const res = await fetch(`${API_URL}detalle_servicios.php?id_orden=${ORDEN_ID_ACTUAL}`);
        const data = await res.json();
        if (data.status === 'success') {
            const tbody = document.getElementById('tabla-servicios-body');
            tbody.innerHTML = '';
            let subtotal = 0;
            data.data.forEach(s => {
                subtotal += parseFloat(s.precio_cobrado);
                tbody.innerHTML += `
                    <tr>
                        <td>${s.descripcion_servicio}</td>
                        <td>$ ${parseFloat(s.precio_cobrado).toFixed(2)}</td>
                        <td><button onclick="eliminarServicio(${s.id_detalle_servicio})">Quitar</button></td>
                    </tr>`;
            });
            document.getElementById('total-servicios').innerText = `$ ${subtotal.toFixed(2)}`;
            calcularGranTotalVisual();
        }
    } catch (error) { console.error(error); }
}

async function cargarRepuestosUsados() {
     try {
        const res = await fetch(`${API_URL}detalle_repuestos.php?id_orden=${ORDEN_ID_ACTUAL}`);
        const data = await res.json();
        if (data.status === 'success') {
            const tbody = document.getElementById('tabla-repuestos-body');
            tbody.innerHTML = '';
            let subtotal = 0;
            data.data.forEach(r => {
                const totalItem = parseFloat(r.precio_unitario_cobrado) * parseInt(r.cantidad);
                subtotal += totalItem;
                tbody.innerHTML += `
                    <tr>
                        <td>${r.nombre_pieza}</td>
                        <td>${r.cantidad}</td>
                        <td>$ ${parseFloat(r.precio_unitario_cobrado).toFixed(2)}</td>
                        <td>$ ${totalItem.toFixed(2)}</td>
                        <td><button onclick="eliminarRepuesto(${r.id_detalle_repuesto})">Quitar</button></td>
                    </tr>`;
            });
            document.getElementById('total-repuestos').innerText = `$ ${subtotal.toFixed(2)}`;
            calcularGranTotalVisual();
        }
    } catch (error) { console.error(error); }
}

async function cargarInventarioParaDropdown() {
    try {
        const res = await fetch(`${API_URL}inventario.php`);
        const data = await res.json();
        if(data.status === 'success') {
            const select = document.getElementById('repuesto-select');
            select.innerHTML = '<option value="">-- Seleccione un Repuesto --</option>';
            data.data.forEach(item => {
                if (item.stock > 0) {
                    select.innerHTML += `<option value="${item.id_repuesto}">${item.nombre_pieza} (Stock: ${item.stock}) - $${item.precio_venta}</option>`;
                }
            });
        }
    } catch (error) { console.error(error); }
}

// --- ACCIONES ---

async function anadirServicio() {
    const descripcion = document.getElementById('servicio-desc').value;
    const precio = document.getElementById('servicio-precio').value;
    try {
        const res = await fetch(`${API_URL}detalle_servicios.php?id_orden=${ORDEN_ID_ACTUAL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descripcion_servicio: descripcion, precio_cobrado: parseFloat(precio) })
        });
        const data = await res.json();
        if (data.status === 'success') {
            cargarServicios();
            document.getElementById('form-nuevo-servicio').reset();
        } else { alert(data.message); }
    } catch (error) { alert(error.message); }
}

async function anadirRepuesto() {
    const idRep = document.getElementById('repuesto-select').value;
    const cant = document.getElementById('repuesto-cantidad').value;
    try {
        const res = await fetch(`${API_URL}detalle_repuestos.php?id_orden=${ORDEN_ID_ACTUAL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_repuesto_fk: idRep, cantidad: cant })
        });
        const data = await res.json();
        if (data.status === 'success') {
            cargarRepuestosUsados();
            cargarInventarioParaDropdown();
            document.getElementById('form-nuevo-repuesto').reset();
        } else { alert(data.message); }
    } catch (error) { alert(error.message); }
}

async function eliminarServicio(id) {
    if(!confirm("¿Quitar servicio?")) return;
    await fetch(`${API_URL}detalle_servicios.php?id_orden=${ORDEN_ID_ACTUAL}&id_detalle=${id}`, { method: 'DELETE' });
    cargarServicios();
}

async function eliminarRepuesto(id) {
    if(!confirm("¿Quitar repuesto y devolver al stock?")) return;
    await fetch(`${API_URL}detalle_repuestos.php?id_orden=${ORDEN_ID_ACTUAL}&id_detalle=${id}`, { method: 'DELETE' });
    cargarRepuestosUsados();
    cargarInventarioParaDropdown();
}

// --- AQUÍ ESTABA EL PROBLEMA ---

async function guardarCambiosInfo() {
    const nuevoEstado = document.getElementById('detalle-estado').value;
    const nuevoDiag = document.getElementById('detalle-diag-taller').value;
    
    // 1. Capturamos el valor del pago
    const nuevoPago = document.getElementById('detalle-pago').value; 

    try {
        const res = await fetch(`${API_URL}ordenes.php?id=${ORDEN_ID_ACTUAL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                estado: nuevoEstado,
                estado_pago: nuevoPago, // 2. ¡Lo enviamos al servidor!
                diagnostico_taller: nuevoDiag
            })
        });
        const data = await res.json();
        if (data.status === 'success') {
            alert("Información actualizada.");
        } else { 
            alert(data.message); 
        }
    } catch (error) { alert(error.message); }
}

async function actualizarTotalEnBD() {
    const totalTexto = document.getElementById('gran-total').innerText;
    const total = parseFloat(totalTexto.replace('$', '')) || 0;
    
    try {
        const res = await fetch(`${API_URL}ordenes.php?id=${ORDEN_ID_ACTUAL}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ total_orden: total })
        });
        const data = await res.json();
        if (data.status === 'success') alert("Total guardado en BD.");
        else alert(data.message);
    } catch (error) { alert(error.message); }
}

// --- AUXILIARES ---

function calcularGranTotalVisual() {
    const serv = parseFloat(document.getElementById('total-servicios').innerText.replace('$', '')) || 0;
    const rep = parseFloat(document.getElementById('total-repuestos').innerText.replace('$', '')) || 0;
    document.getElementById('gran-total').innerText = `$ ${(serv + rep).toFixed(2)}`;
}

function cambiarColorPago() {
    const select = document.getElementById('detalle-pago');
    if(select) {
        select.style.color = select.value === 'Pagado' ? 'green' : 'red';
    }
} 