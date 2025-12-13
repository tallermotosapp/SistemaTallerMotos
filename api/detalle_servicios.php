<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

// Este ID es la LLAVE FORÁNEA de la orden principal
if (!isset($_GET['id_orden'])) {
     http_response_code(400);
     echo json_encode(["status" => "error", "message" => "Falta el ID de la orden (id_orden)"]);
     exit;
}
$id_orden_fk = $_GET['id_orden'];

try {
    switch ($metodo) {
        
        // -------------
        // CASO GET (Listar todos los servicios DE ESTA ORDEN)
        // -------------
        case 'GET':
            $sql = "SELECT * FROM Detalle_Orden_Servicios WHERE id_orden_fk = :id_orden_fk";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([':id_orden_fk' => $id_orden_fk]);
            $servicios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $servicios]);
            break;

        // -------------
        // CASO POST (Añadir un nuevo servicio A ESTA ORDEN)
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['descripcion_servicio']) || !isset($datos['precio_cobrado'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Descripción y Precio son obligatorios"]);
                exit; 
            }
            
            $sql = "INSERT INTO Detalle_Orden_Servicios (id_orden_fk, descripcion_servicio, cantidad, precio_cobrado) 
                    VALUES (:id_orden_fk, :descripcion_servicio, :cantidad, :precio_cobrado)";
            
            $stmt = $conexion->prepare($sql);
            
            $params = [
                ':id_orden_fk' => $id_orden_fk, // De la URL
                ':descripcion_servicio' => $datos['descripcion_servicio'],
                ':cantidad' => $datos['cantidad'] ?? 1, // Default 1
                ':precio_cobrado' => $datos['precio_cobrado']
            ];

            $stmt->execute($params);
            
            $id_nuevo = $conexion->lastInsertId(); 
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Servicio añadido a la orden", "id_detalle_servicio" => $id_nuevo]);
            break;

        // -------------
        // CASO DELETE (Quitar un servicio DE ESTA ORDEN)
        // -------------
        case 'DELETE':
            // Aquí usamos 'id_detalle' para el ID del item específico a borrar
            if (!isset($_GET['id_detalle'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Falta el ID del detalle (id_detalle)"]);
                exit;
            }
            $id_detalle_servicio = $_GET['id_detalle'];
            
            $sql = "DELETE FROM Detalle_Orden_Servicios WHERE id_detalle_servicio = :id_detalle_servicio";
            $stmt = $conexion->prepare($sql);
            $stmt->execute([':id_detalle_servicio' => $id_detalle_servicio]);
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200); 
                echo json_encode(["status" => "success", "message" => "Servicio eliminado de la orden"]);
            } else {
                http_response_code(404); 
                echo json_encode(["status" => "error", "message" => "No se encontró el item de servicio"]);
            }
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["status" => "error", "message" => "Error en la operación de BD: " . $e->getMessage()]);
}
?>