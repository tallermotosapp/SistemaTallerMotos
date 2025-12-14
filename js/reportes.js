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
            
            if (cliente.fecha_cita === hoy) {
                citasHoy++;
                
                const [hora, minuto] = cliente.hora_cita.split(':').map(Number);
                const minutosCita = hora * 60 + minuto;
                
                if (minutosCita > horaActual) {
                    proximasCitas++;
                }
            }
            
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
            clientes.push([
                cliente.nombre,
                cliente.apellido,
                cliente.telefono || '',
                cliente.placa || '',
                cliente.modelo_moto || '',
                cliente.fecha_cita || '',
                cliente.hora_cita || '',
                cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO') : ''
            ]);
        });
        
        const headers = ['Nombre', 'Apellido', 'Teléfono', 'Placa', 'Modelo Moto', 'Fecha Cita', 'Hora Cita', 'Fecha Registro'];
        
        descargarExcel(clientes, headers, 'Clientes_' + new Date().toISOString().split('T')[0]);
        
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
                citas.push([
                    cliente.fecha_cita,
                    cliente.hora_cita,
                    `${cliente.nombre} ${cliente.apellido}`,
                    cliente.telefono || '',
                    cliente.placa || '',
                    cliente.modelo_moto || ''
                ]);
            }
        });
        
        if (citas.length === 0) {
            alert('No hay citas programadas para exportar');
            return;
        }
        
        // Ordenar por fecha y hora
        citas.sort((a, b) => {
            if (a[0] === b[0]) {
                return a[1].localeCompare(b[1]);
            }
            return a[0].localeCompare(b[0]);
        });
        
        const headers = ['Fecha', 'Hora', 'Cliente', 'Teléfono', 'Placa', 'Modelo'];
        
        descargarExcel(citas, headers, 'Citas_' + new Date().toISOString().split('T')[0]);
        
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
            datosCompletos.push([
                key.substring(0, 8),
                `${cliente.nombre} ${cliente.apellido}`,
                cliente.telefono || '',
                cliente.placa || '',
                cliente.modelo_moto || '',
                cliente.fecha_cita || 'Sin cita',
                cliente.hora_cita || '',
                cliente.fecha_registro ? new Date(cliente.fecha_registro).toLocaleDateString('es-CO') : '',
                cliente.fecha_actualizacion ? new Date(cliente.fecha_actualizacion).toLocaleDateString('es-CO') : ''
            ]);
        });
        
        const headers = ['ID', 'Nombre Completo', 'Teléfono', 'Placa Moto', 'Modelo Moto', 'Fecha Cita', 'Hora Cita', 'Fecha Registro', 'Última Actualización'];
        
        descargarExcel(datosCompletos, headers, 'Reporte_Completo_' + new Date().toISOString().split('T')[0]);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al exportar: ' + error.message);
    }
}

// ============================================
// FUNCIÓN PARA DESCARGAR EXCEL (FORMATO CORRECTO)
// ============================================
function descargarExcel(datos, headers, nombreArchivo) {
    if (datos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear CSV con formato correcto para Excel
    let csv = '\uFEFF'; // BOM para UTF-8
    
    // Agregar headers
    csv += headers.map(h => escaparCSV(h)).join('\t') + '\n';
    
    // Agregar datos
    datos.forEach(fila => {
        csv += fila.map(valor => escaparCSV(valor)).join('\t') + '\n';
    });
    
    // Crear Blob y descargar
    const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo + '.xls');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Archivo descargado correctamente\n\n💡 Consejo: Abre con Excel o Google Sheets');
}

// ============================================
// ESCAPAR VALORES PARA CSV
// ============================================
function escaparCSV(valor) {
    if (valor === null || valor === undefined) {
        return '';
    }
    
    valor = String(valor);
    
    // Si contiene tabulador, comilla o salto de línea, envolver en comillas
    if (valor.includes('\t') || valor.includes('"') || valor.includes('\n')) {
        valor = '"' + valor.replace(/"/g, '""') + '"';
    }
    
    return valor;
}

console.log('✅ Módulo de Reportes cargado');
