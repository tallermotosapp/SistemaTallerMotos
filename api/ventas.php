<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        
        // -------------
        // ¡¡NUEVO BLOQUE!!
        // CASO GET (Listar el historial de ventas)
        // -------------
        case 'GET':
            // Buscamos las últimas 50 ventas, de la más nueva a la más vieja
            $sql = "SELECT * FROM Ventas_Mostrador ORDER BY fecha_venta DESC LIMIT 50";
            $stmt = $conexion->prepare($sql);
            $stmt->execute();
            $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $ventas]);
            break;

        // -------------
        // CASO POST (Crear una nueva venta)
        // (Este es el código que ya tenías, ahora dentro del switch)
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            // Validar datos de entrada
            if (empty($datos['cliente']) || empty($datos['items']) || !is_array($datos['items'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Faltan datos del cliente o items"]);
                exit; 
            }
            
            $cliente = $datos['cliente'];
            $items_a_vender = $datos['items'];
            $total_calculado = 0;

            // ¡¡INICIA TRANSACCIÓN!!
            $conexion->beginTransaction();

            // 1. Verificar stock y calcular total
            $precios_verificados = [];
            foreach ($items_a_vender as $item) {
                $id_repuesto = $item['id'];
                $cantidad_a_usar = $item['cantidad'];

                $sql_check = "SELECT stock, precio_venta FROM Repuestos_Inventario WHERE id_repuesto = :id_repuesto FOR UPDATE";
                $stmt_check = $conexion->prepare($sql_check);
                $stmt_check->execute([':id_repuesto' => $id_repuesto]);
                $item_db = $stmt_check->fetch(PDO::FETCH_ASSOC);

                if (!$item_db) {
                    throw new Exception("Repuesto ID $id_repuesto no encontrado.");
                }
                if ($item_db['stock'] < $cantidad_a_usar) {
                    throw new Exception("No hay stock suficiente para el item ID $id_repuesto. Stock actual: " . $item_db['stock']);
                }
                
                $precio_del_item = $item_db['precio_venta'];
                $precios_verificados[$id_repuesto] = $precio_del_item;
                $total_calculado += ($precio_del_item * $cantidad_a_usar);
            }

            // 2. Crear la Venta Maestra
            $sql_venta = "INSERT INTO Ventas_Mostrador (nombre_cliente_venta, telefono_cliente_venta, total_venta) 
                          VALUES (:nombre, :telefono, :total)";
            $stmt_venta = $conexion->prepare($sql_venta);
            $stmt_venta->execute([
                ':nombre' => $cliente['nombre'] ?? 'Mostrador',
                ':telefono' => $cliente['telefono'] ?? null,
                ':total' => $total_calculado
            ]);
            $id_nueva_venta = $conexion->lastInsertId();

            // 3. Restar stock y crear los Detalles de la Venta
            foreach ($items_a_vender as $item) {
                $id_repuesto = $item['id'];
                $cantidad_a_usar = $item['cantidad'];
                $precio_cobrado = $precios_verificados[$id_repuesto];

                // 3a. Restar del stock
                $sql_stock = "UPDATE Repuestos_Inventario SET stock = stock - :cantidad WHERE id_repuesto = :id";
                $stmt_stock = $conexion->prepare($sql_stock);
                $stmt_stock->execute([':cantidad' => $cantidad_a_usar, ':id' => $id_repuesto]);

                // 3b. Añadir al detalle de la venta
                $sql_detalle = "INSERT INTO Detalle_Venta_Mostrador (id_venta_fk, id_repuesto_fk, cantidad, precio_unitario_venta) 
                                VALUES (:id_venta, :id_repuesto, :cantidad, :precio)";
                $stmt_detalle = $conexion->prepare($sql_detalle);
                $stmt_detalle->execute([
                    ':id_venta' => $id_nueva_venta,
                    ':id_repuesto' => $id_repuesto,
                    ':cantidad' => $cantidad_a_usar,
                    ':precio' => $precio_cobrado
                ]);
            }

            // 4. ¡Confirmar Transacción!
            $conexion->commit();
            
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Venta registrada. Stock actualizado.", "id_venta" => $id_nueva_venta]);
            break;

        // -------------
        // DEFAULT (Método no permitido)
        // -------------
        default:
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            break;
    }

} catch (Exception $e) {
    // Si algo falló, ¡revertir todo!
    if ($conexion->inTransaction()) {
        $conexion->rollBack();
    }
    http_response_code(500); // Internal Server Error
    // Ajustado para mostrar el mensaje de error real
    echo json_encode(["status" => "error", "message" => "Error en la transacción: " . $e->getMessage()]);
}
?>