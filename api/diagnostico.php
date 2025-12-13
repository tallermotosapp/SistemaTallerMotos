<?php
include 'conexion.php';

echo "<h1>1. Revisando Columnas de la Tabla</h1>";
try {
    // Preguntamos a la BD qué columnas tiene la tabla Ordenes_Servicio
    $stmt = $conexion->query("DESCRIBE Ordenes_Servicio");
    $columnas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $tiene_pago = false;
    foreach ($columnas as $col) {
        echo "Columna encontrada: <strong>" . $col['Field'] . "</strong> (Tipo: " . $col['Type'] . ")<br>";
        if ($col['Field'] === 'estado_pago') {
            $tiene_pago = true;
        }
    }

    if ($tiene_pago) {
        echo "<h3 style='color:green'>✅ La columna 'estado_pago' SÍ EXISTE.</h3>";
    } else {
        echo "<h3 style='color:red'>❌ ERROR: La columna 'estado_pago' NO EXISTE.</h3>";
        echo "<p>Debes ejecutar el comando SQL para crearla.</p>";
    }

} catch (Exception $e) {
    echo "Error leyendo tabla: " . $e->getMessage();
}

echo "<hr><h1>2. Revisando Datos Guardados</h1>";
try {
    $stmt = $conexion->query("SELECT id_orden, fecha_ingreso, estado_pago FROM Ordenes_Servicio ORDER BY id_orden DESC LIMIT 5");
    $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($datos) > 0) {
        echo "<table border='1'><tr><th>ID</th><th>Fecha</th><th>Estado Pago (En la BD)</th></tr>";
        foreach ($datos as $fila) {
            echo "<tr>";
            echo "<td>" . $fila['id_orden'] . "</td>";
            echo "<td>" . $fila['fecha_ingreso'] . "</td>";
            // Resaltar el valor real
            echo "<td><strong>" . ($fila['estado_pago'] ? $fila['estado_pago'] : 'VACÍO/NULL') . "</strong></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No hay órdenes registradas.";
    }

} catch (Exception $e) {
    echo "Error leyendo datos: " . $e->getMessage(); // Probablemente error porque la columna no existe
}
?>