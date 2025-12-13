<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        
        // -------------
        // CASO GET (Listar Órdenes)
        // -------------
        case 'GET':
            if (isset($_GET['id'])) {
                $id_orden = $_GET['id'];
                $sql = "SELECT * FROM Ordenes_Servicio WHERE id_orden = :id_orden";
                $stmt = $conexion->prepare($sql);
                $stmt->execute([':id_orden' => $id_orden]);
                $orden = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($orden) {
                    http_response_code(200);
                    echo json_encode(["status" => "success", "data" => $orden]);
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "message" => "Orden no encontrada"]);
                }
            } 
            elseif (isset($_GET['id_cliente'])) {
                $id_cliente = $_GET['id_cliente'];
                // ¡IMPORTANTE! Aquí pedimos 'estado_pago'
                $sql = "SELECT 
                            o.id_orden, o.fecha_ingreso, o.estado, o.total_orden, o.estado_pago,
                            m.placa, m.marca,
                            c.nombre, c.apellido
                        FROM Ordenes_Servicio AS o
                        JOIN Motos AS m ON o.id_moto_fk = m.id_moto
                        JOIN Clientes AS c ON m.id_cliente_fk = c.id_cliente
                        WHERE c.id_cliente = :id_cliente
                        ORDER BY o.fecha_ingreso DESC";
                
                $stmt = $conexion->prepare($sql);
                $stmt->execute([':id_cliente' => $id_cliente]);
                $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $ordenes]);
            }
            else {
                $sql = "SELECT 
                            o.id_orden, o.fecha_ingreso, o.estado, o.total_orden, o.estado_pago,
                            m.placa, m.marca,
                            c.nombre, c.apellido
                        FROM Ordenes_Servicio AS o
                        JOIN Motos AS m ON o.id_moto_fk = m.id_moto
                        JOIN Clientes AS c ON m.id_cliente_fk = c.id_cliente
                        ORDER BY o.fecha_ingreso DESC";
                        
                $stmt = $conexion->prepare($sql);
                $stmt->execute();
                $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $ordenes]);
            }
            break;

        // -------------
        // CASO POST (Crear Nueva Orden)
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['id_moto_fk']) || empty($datos['diagnostico_cliente'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Faltan datos obligatorios"]);
                exit; 
            }
            
            // Al crear, ponemos 'Pendiente' por defecto
            $sql = "INSERT INTO Ordenes_Servicio (id_moto_fk, diagnostico_cliente, diagnostico_taller, estado, estado_pago) 
                    VALUES (:id_moto_fk, :diagnostico_cliente, :diagnostico_taller, :estado, 'Pendiente')";
            
            $stmt = $conexion->prepare($sql);
            
            $params = [
                ':id_moto_fk' => $datos['id_moto_fk'],
                ':diagnostico_cliente' => $datos['diagnostico_cliente'],
                ':diagnostico_taller' => $datos['diagnostico_taller'] ?? null,
                ':estado' => $datos['estado'] ?? 'Pendiente'
            ];

            $stmt->execute($params);
            
            $id_nuevo = $conexion->lastInsertId(); 
            http_response_code(201); 
            echo json_encode(["status" => "success", "message" => "Orden creada", "id_orden" => $id_nuevo]);
            break;

        // -------------
        // CASO PUT (Actualizar Orden) - ¡ESTE ES EL CRÍTICO!
        // -------------
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400); echo json_encode(["status" => "error", "message" => "Falta ID"]); exit;
            }
            $id_orden = $_GET['id'];
            $datos = json_decode(file_get_contents('php://input'), true);

            // Obtener datos actuales
            $stmt_get = $conexion->prepare("SELECT * FROM Ordenes_Servicio WHERE id_orden = :id");
            $stmt_get->execute([':id' => $id_orden]);
            $orden_actual = $stmt_get->fetch(PDO::FETCH_ASSOC);

            if(!$orden_actual) {
                 http_response_code(404); echo json_encode(["status" => "error", "message" => "Orden no encontrada"]); exit;
            }

            // Variables
            $diag_taller = $datos['diagnostico_taller'] ?? $orden_actual['diagnostico_taller'];
            $estado = $datos['estado'] ?? $orden_actual['estado'];
            $estado_pago = $datos['estado_pago'] ?? $orden_actual['estado_pago']; // <--- ¡AQUÍ RECIBIMOS EL PAGO!
            $total = $datos['total_orden'] ?? $orden_actual['total_orden'];
            
            $fecha_entrega = $datos['fecha_entrega'] ?? $orden_actual['fecha_entrega'];
            $fecha_entrega_final = !empty($fecha_entrega) ? $fecha_entrega : null;
            
            // Actualizar en BD
            $sql = "UPDATE Ordenes_Servicio SET 
                        diagnostico_taller = :diag, 
                        estado = :estado,
                        estado_pago = :pago,  /* <--- ¡AQUÍ LO GUARDAMOS! */
                        fecha_entrega = :fecha,
                        total_orden = :total
                    WHERE id_orden = :id";
            
            $stmt = $conexion->prepare($sql);
            $stmt->execute([
                ':diag' => $diag_taller,
                ':estado' => $estado,
                ':pago' => $estado_pago, // <--- ¡AQUÍ LO PASAMOS!
                ':fecha' => $fecha_entrega_final,
                ':total' => $total,
                ':id' => $id_orden
            ]);
            
            http_response_code(200); 
            echo json_encode(["status" => "success", "message" => "Orden actualizada"]);
            break;

        // -------------
        // CASO DELETE (Borrar Orden)
        // -------------
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400); echo json_encode(["status" => "error", "message" => "Falta ID"]); exit;
            }
            $id_orden = $_GET['id'];
            
            $conexion->prepare("DELETE FROM Detalle_Orden_Repuestos WHERE id_orden_fk = :id")->execute([':id' => $id_orden]);
            $conexion->prepare("DELETE FROM Detalle_Orden_Servicios WHERE id_orden_fk = :id")->execute([':id' => $id_orden]);
            $stmt = $conexion->prepare("DELETE FROM Ordenes_Servicio WHERE id_orden = :id");
            $stmt->execute([':id' => $id_orden]);
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200); echo json_encode(["status" => "success", "message" => "Orden borrada"]);
            } else {
                http_response_code(404); echo json_encode(["status" => "error", "message" => "Orden no encontrada"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500); 
    echo json_encode(["status" => "error", "message" => "BD Error: " . $e->getMessage()]);
}
?>