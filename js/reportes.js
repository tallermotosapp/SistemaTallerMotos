// ============================================
// REPORTES - EXPORTAR A EXCEL
// ============================================

import { 
    database, 
    ref,
    get,
    onValue,
    verificarAutenticacion
} from '../firebase-config.js';

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await verificarAutenticacion();
    } catch (error) {
        return;
    }
    
    cargarEstadisticas();
});

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================
function cargarEstadisticas() {
    const clientesRef = ref(database, 'clientes');
    
    onValue(clientesRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            calcularEstadisticas(data);
        }
    });
}

// ============================================
// CALCULAR ESTADÍSTICAS
// ============================================
function calcularEstadisticas(data) {
    const hoy = new Date().toISOString().split('T')[0];
    const mesActual = new Date().getMonth();
    const anioActual = new Date().getFullYear();
    
    let totalClientes = 0;
    let citasHoy = 0;
    let citasMes = 0;
    let proximasCitas = 0;
    
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    
    Object.keys(data).forEach(key => {
        const cliente = data[key];
        totalClientes++;
        
        if (cliente.fecha_cita && cliente.hora_cita) {
            const fechaCita = new Date(cliente.fecha_cita);
            
            // Citas de hoy
            if (cliente.fecha_cita === hoy) {
                citasHoy++;
                
                const [hora, minuto] = cliente.hora_cita.split(':').map(Number);
                const minutosCita = hora * 60 + minuto;
                
                if (minutosCita > horaActual) {
                    proximasCitas++;
                }
            }
            
            // Citas del mes
            if (fechaCita.getMonth() === mesActual && fechaCita.getFullYear() === anioActual) {
                citasMes++;
            }
        }
    });
    
    document.getElementById('total-clientes').textContent = totalClientes;
    document.getElementById('citas-hoy').textContent = citasHoy;
    document.getElementById('citas-mes').textContent = citasMes;
    document.getElementById('proximas-citas').textContent = proximasCitas;
}

// ============================================
// EXPORTAR CLIENTES A EXCEL
// ============================================
window.exportarClientes = async function() {
    try {
        const clientesRef = ref(database, 'clientes');
        const snapshot = await get(clientesRef);
        
        if (!snapshot.exists()) {
            alert('No hay clientes para exportar');
            return;
        }
        
        const data = snapshot.val();
        const clientes = [];
        
        Object.keys(data).forEach(key => {
            const cliente = data[key];
            clientes.push({
                'Nombre': cliente.nombre,
                'Apellido': cliente.apellido,
                'Teléfono': cliente.telefono || '',
                'Placa': cliente.placa || '',
                'Modelo Moto': cliente.modelo_moto || '',
                'Fecha Cita': cliente.fecha_cita || '',
                'Hora Cita': cliente.hora_cita || '',
                'Fecha Registro': cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO') : ''
            });
        });
        
        descargarCSV(clientes, 'Clientes_' + new Date().toISOString().split('T')[0]);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar: ' + error.message);
    }
}

// ============================================
// EXPORTAR CITAS A EXCEL
// ============================================
window.exportarCitas = async function() {
    try {
        const clientesRef = ref(database, 'clientes');
        const snapshot = await get(clientesRef);
        
        if (!snapshot.exists()) {
            alert('No hay citas para exportar');
            return;
        }
        
        const data = snapshot.val();
        const citas = [];
        
        Object.keys(data).forEach(key => {
            const cliente = data[key];
            
            if (cliente.fecha_cita && cliente.hora_cita) {
                citas.push({
                    'Fecha': cliente.fecha_cita,
                    'Hora': cliente.hora_cita,
                    'Cliente': `${cliente.nombre} ${cliente.apellido}`,
                    'Teléfono': cliente.telefono || '',
                    'Placa': cliente.placa || '',
                    'Modelo': cliente.modelo_moto || ''
                });
            }
        });
        
        if (citas.length === 0) {
            alert('No hay citas programadas para exportar');
            return;
        }
        
        // Ordenar por fecha y hora
        citas.sort((a, b) => {
            if (a.Fecha === b.Fecha) {
                return a.Hora.localeCompare(b.Hora);
            }
            return a.Fecha.localeCompare(b.Fecha);
        });
        
        descargarCSV(citas, 'Citas_' + new Date().toISOString().split('T')[0]);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar: ' + error.message);
    }
}

// ============================================
// EXPORTAR TODO
// ============================================
window.exportarTodo = async function() {
    try {
        const clientesRef = ref(database, 'clientes');
        const snapshot = await get(clientesRef);
        
        if (!snapshot.exists()) {
            alert('No hay datos para exportar');
            return;
        }
        
        const data = snapshot.val();
        const datosCompletos = [];
        
        Object.keys(data).forEach(key => {
            const cliente = data[key];
            datosCompletos.push({
                'ID': key.substring(0, 8),
                'Nombre Completo': `${cliente.nombre} ${cliente.apellido}`,
                'Teléfono': cliente.telefono || '',
                'Placa Moto': cliente.placa || '',
                'Modelo Moto': cliente.modelo_moto || '',
                'Fecha Cita': cliente.fecha_cita || 'Sin cita',
                'Hora Cita': cliente.hora_cita || '',
                'Fecha Registro': cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO') : '',
                'Última Actualización': cliente.fecha_actualizacion ? new Date(cliente.fecha_actualizacion).toLocaleDateString('es-CO') : ''
            });
        });
        
        descargarCSV(datosCompletos, 'Reporte_Completo_' + new Date().toISOString().split('T')[0]);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar: ' + error.message);
    }
}

// ============================================
// FUNCIÓN PARA DESCARGAR CSV
// ============================================
function descargarCSV(datos, nombreArchivo) {
    if (datos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Obtener headers
    const headers = Object.keys(datos[0]);
    
    // Crear filas CSV
    let csv = headers.join(',') + '\n';
    
    datos.forEach(fila => {
        const valores = headers.map(header => {
            let valor = fila[header];
            // Escapar comillas y comas
            if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
                valor = `"${valor.replace(/"/g, '""')}"`;
            }
            return valor;
        });
        csv += valores.join(',') + '\n';
    });
    
    // Crear Blob y descargar
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo + '.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Archivo descargado correctamente');
}

console.log('✅ Módulo de Reportes cargado');
