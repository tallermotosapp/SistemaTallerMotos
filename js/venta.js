/* --- INICIA CÓDIGO JS (venta.js) --- */
const API_URL = "api/";

// ==================================
// ESTADO (Variables Globales)
// ==================================
let inventarioCache = []; // Para guardar el inventario
let carrito = []; // El carrito de compras

// ==================================
// INICIALIZACIÓN
// ==================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar el inventario
    cargarInventario();
    
    // 2. ¡NUEVO! Cargar el historial de ventas
    cargarHistorialVentas();

    // 3. Listeners
    document.getElementById('filtro-inventario').addEventListener('input', renderTablaInventario);
    document.getElementById('form-checkout').addEventListener('submit', (e) => {
        e.preventDefault();
        finalizarVenta();
    });
});

/**
 * 1. Carga el inventario desde la API
 */
async function cargarInventario() {
    try {
        const res = await fetch(API_URL + 'inventario.php');
        const data = await res.json();
        if (data.status === 'success') {
            // Solo guardamos items con stock
            inventarioCache = data.data.filter(item => item.stock > 0);
            renderTablaInventario();
        } else {
            alert("Error al cargar inventario: " + data.message);
        }
    } catch (error) {
        console.error("Error red (inventario):", error);
    }
}

/**
 * 2. Muestra el inventario en la tabla izquierda (y aplica el filtro)
 */
function renderTablaInventario() {
    const tbody = document.getElementById('tabla-inventario-body');
    const filtro = document.getElementById('filtro-inventario').value.toLowerCase();
    tbody.innerHTML = '';

    const inventarioFiltrado = inventarioCache.filter(item => 
        item.nombre_pieza.toLowerCase().includes(filtro) || 
        item.codigo_sku.toLowerCase().includes(filtro)
    );

    inventarioFiltrado.forEach(item => {
        const fila = `
            <tr>
                <td>${item.nombre_pieza}</td>
                <td>$ ${item.precio_venta}</td>
                <td>${item.stock}</td>
                <td>
                    <button onclick="anadirAlCarrito(${item.id_repuesto})">Añadir</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
}

/**
 * 3. Muestra el carrito en la tabla derecha
 */
function renderCarrito() {
    const tbody = document.getElementById('tabla-carrito-body');
    tbody.innerHTML = '';
    let totalVenta = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalVenta += subtotal;
        const fila = `
            <tr>
                <td>${item.nombre}</td>
                <td>
                    <input type="number" value="${item.cantidad}" min="1" max="${item.stock_max}" 
                           onchange="actualizarCantidad(${item.id}, this.value)" style="width: 50px;">
                </td>
                <td>$ ${item.precio.toFixed(2)}</td>
                <td>$ ${subtotal.toFixed(2)}</td>
                <td>
                    <button onclick="quitarDelCarrito(${item.id})">Quitar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += fila;
    });
    
    document.getElementById('total-venta').innerText = `$ ${totalVenta.toFixed(2)}`;
}

// ==================================
// ACCIONES DEL CARRITO
// ==================================

/**
 * 4. Añadir un item del inventario al carrito
 */
function anadirAlCarrito(idRepuesto) {
    // Buscar si ya está en el carrito
    let itemEnCarrito = carrito.find(item => item.id === idRepuesto);
    
    if (itemEnCarrito) {
        // Si está, sumar 1 (si hay stock)
        const itemEnInventario = inventarioCache.find(item => item.id_repuesto === idRepuesto);
        if (itemEnCarrito.cantidad < itemEnInventario.stock) {
            itemEnCarrito.cantidad++;
        } else {
            alert("No hay más stock disponible.");
        }
    } else {
        // Si no está, añadirlo
        const itemEnInventario = inventarioCache.find(item => item.id_repuesto === idRepuesto);
        if (itemEnInventario && itemEnInventario.stock > 0) {
            carrito.push({
                id: itemEnInventario.id_repuesto,
                nombre: itemEnInventario.nombre_pieza,
                precio: parseFloat(itemEnInventario.precio_venta),
                cantidad: 1,
                stock_max: itemEnInventario.stock // Guardamos el stock máximo
            });
        }
    }
    renderCarrito();
}

/**
 * 5. Quitar un item del carrito
 */
function quitarDelCarrito(idRepuesto) {
    carrito = carrito.filter(item => item.id !== idRepuesto);
    renderCarrito();
}

/**
 * 6. Actualizar cantidad desde el input
 */
function actualizarCantidad(idRepuesto, nuevaCantidad) {
    let itemEnCarrito = carrito.find(item => item.id === idRepuesto);
    if (!itemEnCarrito) return;
    
    nuevaCantidad = parseInt(nuevaCantidad);
    
    if (nuevaCantidad > itemEnCarrito.stock_max) {
        alert("Cantidad excede el stock disponible: " + itemEnCarrito.stock_max);
        nuevaCantidad = itemEnCarrito.stock_max;
    }
    if (nuevaCantidad < 1) {
        nuevaCantidad = 1;
    }
    
    itemEnCarrito.cantidad = nuevaCantidad;
    renderCarrito();
}

/**
 * 7. FINALIZAR VENTA (POST)
 */
async function finalizarVenta() {
    if (carrito.length === 0) {
        alert("El carrito está vacío.");
        return;
    }

    if (!confirm("¿Está seguro de que desea finalizar esta venta? Esto restará el stock.")) {
        return;
    }

    const datosVenta = {
        cliente: {
            nombre: document.getElementById('venta-cliente-nombre').value || 'Mostrador',
            telefono: document.getElementById('venta-cliente-telefono').value
        },
        items: carrito.map(item => ({
            id: item.id,
            cantidad: item.cantidad
        }))
    };

    try {
        const res = await fetch(API_URL + 'ventas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        const data = await res.json();

        if (data.status === 'success') {
            alert(`¡Venta #${data.id_venta} registrada con éxito!`);
            // Resetear todo
            carrito = [];
            document.getElementById('form-checkout').reset();
            renderCarrito();
            cargarInventario(); // Recargar inventario para ver nuevo stock
            
            // ¡¡NUEVO!! Recargar el historial
            cargarHistorialVentas(); 
            
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        alert("Error al finalizar la venta: " + error.message);
        console.error("Error (venta):", error);
    }
}

// ==================================
// ¡¡NUEVA SECCIÓN DE HISTORIAL!!
// ==================================

/**
 * 8. Carga el historial de ventas (GET)
 */
async function cargarHistorialVentas() {
    console.log("Cargando historial de ventas...");
    const tbody = document.getElementById('tabla-historial-body');
    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>'; // Mensaje de carga

    try {
        const res = await fetch(API_URL + 'ventas.php'); // Petición GET
        const data = await res.json();

        if (data.status === 'success') {
            tbody.innerHTML = ''; // Limpiar la tabla
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No hay ventas registradas.</td></tr>';
            }
            
            data.data.forEach(venta => {
                const fecha = new Date(venta.fecha_venta).toLocaleString('es-CO');
                const fila = `
                    <tr>
                        <td>${venta.id_venta}</td>
                        <td>${fecha}</td>
                        <td>${venta.nombre_cliente_venta}</td>
                        <td>${venta.telefono_cliente_venta || 'N/A'}</td>
                        <td>$ ${parseFloat(venta.total_venta).toFixed(2)}</td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error red (historial):", error);
        tbody.innerHTML = `<tr><td colspan="5">Error al cargar historial: ${error.message}</td></tr>`;
    }
}