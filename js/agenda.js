// ============================================
// AGENDA - SISTEMA DE CITAS
// ============================================

import { 
    database, 
    ref, 
    get,
    onValue,
    verificarAutenticacion
} from '../firebase-config.js';

let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let diaSeleccionado = new Date().getDate();
let citasCache = [];

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await verificarAutenticacion();
    } catch (error) {
        return;
    }
    
    document.getElementById('btn-mes-anterior').addEventListener('click', mesAnterior);
    document.getElementById('btn-mes-siguiente').addEventListener('click', mesSiguiente);
    
    cargarCitas();
    renderizarCalendario();
});

// ============================================
// CARGAR CITAS DESDE FIREBASE
// ============================================
function cargarCitas() {
    const clientesRef = ref(database, 'clientes');
    
    onValue(clientesRef, (snapshot) => {
        citasCache = [];
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            
            Object.keys(data).forEach(key => {
                const cliente = data[key];
                
                if (cliente.fecha_cita && cliente.hora_cita) {
                    citasCache.push({
                        id: key,
                        nombre: `${cliente.nombre} ${cliente.apellido}`,
                        telefono: cliente.telefono,
                        fecha: cliente.fecha_cita,
                        hora: cliente.hora_cita,
                        placa: cliente.placa,
                        modelo: cliente.modelo_moto
                    });
                }
            });
            
            renderizarCalendario();
            mostrarCitasDelDia();
        }
    });
}

// ============================================
// RENDERIZAR CALENDARIO
// ============================================
function renderizarCalendario() {
    document.getElementById('mes-actual').textContent = `${meses[mesActual]} ${anioActual}`;
    
    const primerDia = new Date(anioActual, mesActual, 1).getDay();
    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    
    const diasCalendario = document.getElementById('dias-calendario');
    diasCalendario.innerHTML = '';
    
    // Días vacíos antes del primer día
    for (let i = 0; i < primerDia; i++) {
        const diaVacio = document.createElement('div');
        diaVacio.classList.add('dia');
        diasCalendario.appendChild(diaVacio);
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const diaDiv = document.createElement('div');
        diaDiv.classList.add('dia');
        diaDiv.textContent = dia;
        
        const fechaDia = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        
        // Verificar si tiene citas
        const tieneCitas = citasCache.some(cita => cita.fecha === fechaDia);
        if (tieneCitas) {
            diaDiv.classList.add('con-citas');
        }
        
        // Marcar día actual
        const hoy = new Date();
        if (dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear()) {
            diaDiv.classList.add('hoy');
        }
        
        // Marcar día seleccionado
        if (dia === diaSeleccionado) {
            diaDiv.classList.add('seleccionado');
        }
        
        diaDiv.addEventListener('click', () => {
            diaSeleccionado = dia;
            renderizarCalendario();
            mostrarCitasDelDia();
        });
        
        diasCalendario.appendChild(diaDiv);
    }
}

// ============================================
// MOSTRAR CITAS DEL DÍA SELECCIONADO
// ============================================
function mostrarCitasDelDia() {
    const fechaSeleccionada = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(diaSeleccionado).padStart(2, '0')}`;
    
    document.getElementById('fecha-seleccionada').textContent = 
        `Citas del ${diaSeleccionado} de ${meses[mesActual]} ${anioActual}`;
    
    const citasDelDia = citasCache.filter(cita => cita.fecha === fechaSeleccionada);
    
    const listaCitas = document.getElementById('lista-citas');
    listaCitas.innerHTML = '';
    
    if (citasDelDia.length === 0) {
        listaCitas.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">No hay citas para este día</p>';
        return;
    }
    
    // Ordenar por hora
    citasDelDia.sort((a, b) => a.hora.localeCompare(b.hora));
    
    citasDelDia.forEach(cita => {
        const citaCard = document.createElement('div');
        citaCard.classList.add('cita-card');
        
        citaCard.innerHTML = `
            <div class="cita-hora">🕐 ${cita.hora}</div>
            <div class="cita-cliente">👤 ${cita.nombre}</div>
            <div class="cita-detalles">
                📞 ${cita.telefono || 'Sin teléfono'}<br>
                🏍️ ${cita.placa || 'Sin placa'} - ${cita.modelo || 'Sin modelo'}
            </div>
            ${cita.telefono ? `<button class="btn-whatsapp" onclick="window.enviarWhatsApp('${cita.telefono}', '${cita.nombre}', '${fechaSeleccionada}', '${cita.hora}')">💬 Enviar Recordatorio</button>` : ''}
        `;
        
        listaCitas.appendChild(citaCard);
    });
}

// ============================================
// NAVEGACIÓN DE MES
// ============================================
function mesAnterior() {
    if (mesActual === 0) {
        mesActual = 11;
        anioActual--;
    } else {
        mesActual--;
    }
    renderizarCalendario();
}

function mesSiguiente() {
    if (mesActual === 11) {
        mesActual = 0;
        anioActual++;
    } else {
        mesActual++;
    }
    renderizarCalendario();
}

// ============================================
// ENVIAR WHATSAPP
// ============================================
window.enviarWhatsApp = function(telefono, nombre, fecha, hora) {
    // Limpiar número (quitar espacios, guiones, etc.)
    let numeroLimpio = telefono.replace(/\D/g, '');
    
    // Si no empieza con 57 (código Colombia), agregarlo
    if (!numeroLimpio.startsWith('57')) {
        numeroLimpio = '57' + numeroLimpio;
    }
    
    const mensaje = `Hola ${nombre}! 👋

Te recordamos que tienes una cita programada:

📅 Fecha: ${fecha}
🕐 Hora: ${hora}
🏍️ Taller de Motos

¡Te esperamos!`;
    
    const mensajeCodificado = encodeURIComponent(mensaje);
    const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${mensajeCodificado}`;
    
    window.open(urlWhatsApp, '_blank');
}

console.log('✅ Módulo de Agenda cargado');
