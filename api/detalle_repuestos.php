<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

// ID de la orden principal (requerido para GET y POST)
$id_orden_fk = $_GET['id_orden'] ?? null;

try {
    switch ($metodo) {
        
        // -------------
        // CASO GET (Listar repuestos DE ESTA ORDEN)
        // -------------
        case 'GET':
            if (!$id_orden_fk) {
                 http_response_code(400);
                 echo json_encode(["status" => "error", "message" => "Falta el ID de la orden (id_orden)"]);
                 exit;
            }
            
            // Unimos con la tabla de inventario para saber el NOMBRE del repuesto
            $sql = "SELECT 
                        dr.id_detalle_repuesto, 
                        dr.cantidad, 
                        dr.precio_unitario_cobrado,
                        ri.nombre_pieza, 
                        ri.codigo_sku
                    FROM Detalle_Orden_Repuestos AS dr
                    JOIN Repuestos_Inventario AS ri ON dr.id_repuesto_fk = ri.id_repuesto
                    WHERE dr.id_orden_fk = :id_orden_fk";
                    
            $stmt = $conexion->prepare($sql);
            $stmt->execute([':id_orden_fk' => $id_orden_fk]);
            $repuestos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $repuestos]);
            break;

        // -------------
        // CASO POST (Añadir un repuesto A ESTA ORDEN Y RESTAR STOCK)
        // -------------
        case 'POST':
            if (!$id_orden_fk) {
                 http_response_code(400);
                 echo json_encode(["status" => "error", "message" => "Falta el ID de la orden (id_orden)"]);
                 exit;
            }
            
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['id_repuesto_fk']) || empty($datos['cantidad'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "ID de Repuesto y Cantidad son obligatorios"]);
                exit; 
            }
            
            $id_repuesto = $datos['id_repuesto_fk'];
            $cantidad_a_usar = $datos['cantidad'];

            // ¡¡INICIA TRANSACCIÓN!!
            $conexion->beginTransaction();

            // 1. Verificar stock y obtener precio
            $sql_check = "SELECT stock, precio_venta FROM Repuestos_Inventario WHERE id_repuesto = :id_repuesto FOR UPDATE";
            $stmt_check = $conexion->prepare($sql_check);
            $stmt_check->execute([':id_repuesto' => $id_repuesto]);
            $item = $stmt_check->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                $conexion->rollBack(); // Revertir
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Repuesto no encontrado en inventario"]);
                exit;
            }

            if ($item['stock'] < $cantidad_a_usar) {
                $conexion->rollBack(); // Revertir
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "No hay stock suficiente. Stock actual: " . $item['stock']]);
                exit;
            }
            
            $precio_del_item = $item['precio_venta'];

            // 2. Restar del stock
            $sql_update_stock = "UPDATE Repuestos_Inventario SET stock = stock - :cantidad_a_usar WHERE id_repuesto = :id_repuesto";
            $stmt_update = $conexion->prepare($sql_update_stock);
            $stmt_update->execute([
                ':cantidad_a_usar' => $cantidad_a_usar,
                ':id_repuesto' => $id_repuesto
            ]);

            // 3. Añadir al detalle de la orden
            $sql_insert_detalle = "INSERT INTO Detalle_Orden_Repuestos (id_orden_fk, id_repuesto_fk, cantidad, precio_unitario_cobrado) 
                                   VALUES (:id_orden_fk, :id_repuesto_fk, :cantidad, :precio_unitario_cobrado)";
            $stmt_insert = $conexion->prepare($sql_insert_detalle);
            $stmt_insert->execute([
                ':id_orden_fk' => $id_orden_fk,
                ':id_repuesto_fk' => $id_repuesto,
                ':cantidad' => $cantidad_a_usar,
                ':precio_unitario_cobrado' => $precio_del_item
            ]);

            // 4. ¡Confirmar Transacción!
            $conexion->commit();
            
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Repuesto añadido y stock actualizado"]);
            break;

        // -------------
        // CASO DELETE (Quitar repuesto DE LA ORDEN Y DEVOLVER STOCK)
        // -------------
        case 'DELETE':
            // Aquí usamos 'id_detalle' para el ID del item específico a borrar
            if (!isset($_GET['id_detalle'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Falta el ID del detalle (id_detalle)"]);
                exit;
            }
            $id_detalle_repuesto = $_GET['id_detalle'];

            // ¡¡INICIA TRANSACCIÓN!!
            $conexion->beginTransaction();

            // 1. Obtener el repuesto y cantidad ANTES de borrarlo
            $sql_get = "SELECT id_repuesto_fk, cantidad FROM Detalle_Orden_Repuestos WHERE id_detalle_repuesto = :id_detalle_repuesto";
            $stmt_get = $conexion->prepare($sql_get);
            $stmt_get->execute([':id_detalle_repuesto' => $id_detalle_repuesto]);
            $detalle = $stmt_get->fetch(PDO::FETCH_ASSOC);

            if (!$detalle) {
                $conexion->rollBack();
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Detalle de repuesto no encontrado"]);
                exit;
            }
            
            $id_repuesto_a_devolver = $detalle['id_repuesto_fk'];
            $cantidad_a_devolver = $detalle['cantidad'];

            // 2. Borrar el detalle
            $sql_delete = "DELETE FROM Detalle_Orden_Repuestos WHERE id_detalle_repuesto = :id_detalle_repuesto";
            $stmt_delete = $conexion->prepare($sql_delete);
            $stmt_delete->execute([':id_detalle_repuesto' => $id_detalle_repuesto]);

            // 3. Devolver al stock
            $sql_update_stock = "UPDATE Repuestos_Inventario SET stock = stock + :cantidad_a_devolver WHERE id_repuesto = :id_repuesto_a_devolver";
            $stmt_update = $conexion->prepare($sql_update_stock);
            $stmt_update->execute([
                ':cantidad_a_devolver' => $cantidad_a_devolver,
                ':id_repuesto_a_devolver' => $id_repuesto_a_devolver
            ]);
            
            // 4. ¡Confirmar Transacción!
            $conexion->commit();

            http_response_code(200); 
            echo json_encode(["status" => "success", "message" => "Repuesto eliminado y stock devuelto"]);
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            break;
    }

} catch (Exception $e) {
    // Si algo falló, ¡revertir todo!
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500); // Internal Server Error
    echo json_encode(["status" => "error", "message" => "Error en la transacción: " . $e->getMessage()]);
}
?>