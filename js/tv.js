// ============================================
// PANTALLA TV - ACTUALIZACIÓN CADA 5 MIN
// ============================================

import { 
    database, 
    ref,
    onValue
} from '../firebase-config.js';

let citasAnteriores = 0;
const SONIDO_ACTIVO = true;
const MINUTOS_ACTUALIZACION = 5;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📺 Pantalla TV iniciada');
    
    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
    
    cargarDatos();
    
    // Actualizar cada 5 minutos
    setInterval(() => {
        console.log('🔄 Actualizando datos...');
        cargarDatos();
    }, MINUTOS_ACTUALIZACION * 60 * 1000);
});

// ============================================
// ACTUALIZAR FECHA Y HORA
// ============================================
function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('fecha-hora').textContent = 
        ahora.toLocaleDateString('es-CO', opciones);
}

// ============================================
// CARGAR DATOS
// ============================================
function cargarDatos() {
    const clientesRef = ref(database, 'clientes');
    
    onValue(clientesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            procesarDatos(data);
            actualizarUltimaActualizacion();
        } else {
            // Si no hay datos, mostrar ceros
            document.getElementById('citas-hoy').textContent = '0';
            document.getElementById('proximas').textContent = '0';
            document.getElementById('completadas').textContent = '0';
            document.getElementById('clientes-total').textContent = '0';
            document.getElementById('lista-citas').innerHTML = '<div class="sin-citas">No hay citas programadas para hoy</div>';
        }
    });
}

// ============================================
// PROCESAR DATOS
// ============================================
function procesarDatos(data) {
    const hoy = new Date().toISOString().split('T')[0];
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    let citasHoy = [];
    let totalClientes = 0;
    let proximasCitas = 0;
    let completadas = 0;
    
    Object.keys(data).forEach(key => {
        const cliente = data[key];
        totalClientes++;
        
        if (cliente.fecha_cita && cliente.hora_cita) {
            if (cliente.fecha_cita === hoy) {
                const [hora, minuto] = cliente.hora_cita.split(':').map(Number);
                const minutosCita = hora * 60 + minuto;
                
                citasHoy.push({
                    nombre: `${cliente.nombre} ${cliente.apellido}`,
                    telefono: cliente.telefono || 'Sin teléfono',
                    hora: cliente.hora_cita,
                    placa: cliente.placa || 'Sin placa',
                    modelo: cliente.modelo_moto || 'Sin modelo',
                    minutos: minutosCita
                });
                
                if (minutosCita > horaActual) {
                    proximasCitas++;
                } else {
                    completadas++;
                }
            }
        }
    });
    
    // Ordenar por hora
    citasHoy.sort((a, b) => a.minutos - b.minutos);
    
    // Actualizar estadísticas
    document.getElementById('citas-hoy').textContent = citasHoy.length;
    document.getElementById('proximas').textContent = proximasCitas;
    document.getElementById('completadas').textContent = completadas;
    document.getElementById('clientes-total').textContent = totalClientes;
    
    // Reproducir sonido si hay nuevas citas
    if (SONIDO_ACTIVO && citasHoy.length > citasAnteriores) {
        reproducirSonido();
    }
    citasAnteriores = citasHoy.length;
    
    // Renderizar citas
    renderizarCitas(citasHoy);
}

// ============================================
// RENDERIZAR CITAS
// ============================================
function renderizarCitas(citas) {
    const listaCitas = document.getElementById('lista-citas');
    
    if (citas.length === 0) {
        listaCitas.innerHTML = '<div class="sin-citas">No hay citas programadas para hoy</div>';
        return;
    }
    
    listaCitas.innerHTML = '';
    
    citas.forEach(cita => {
        const citaDiv = document.createElement('div');
        citaDiv.classList.add('cita-item');
        
        citaDiv.innerHTML = `
            <div class="cita-hora">🕐 ${cita.hora}</div>
            <div class="cita-info">
                <div class="nombre">👤 ${cita.nombre}</div>
                <div class="detalles">🏍️ ${cita.placa} - ${cita.modelo}</div>
            </div>
            <div class="cita-telefono">📞 ${cita.telefono}</div>
        `;
        
        listaCitas.appendChild(citaDiv);
    });
}

// ============================================
// ACTUALIZAR ÚLTIMA ACTUALIZACIÓN
// ============================================
function actualizarUltimaActualizacion() {
    const ahora = new Date();
    const hora = String(ahora.getHours()).padStart(2, '0');
    const minuto = String(ahora.getMinutes()).padStart(2, '0');
    document.getElementById('ultima-actualizacion').textContent = `${hora}:${minuto}`;
}

// ============================================
// REPRODUCIR SONIDO
// ============================================
function reproducirSonido() {
    const audio = document.getElementById('sonido-notificacion');
    audio.play().catch(error => {
        console.log('No se pudo reproducir el sonido:', error);
    });
}

console.log('✅ Pantalla TV cargada');
