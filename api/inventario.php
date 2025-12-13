<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        
        // -------------
        // CASO GET (Listar/Buscar 1 item)
        // -------------
        case 'GET':
            if (isset($_GET['id'])) {
                // Buscar un item por ID
                $id_repuesto = $_GET['id'];
                $sql = "SELECT * FROM Repuestos_Inventario WHERE id_repuesto = :id_repuesto";
                $stmt = $conexion->prepare($sql);
                $stmt->bindParam(':id_repuesto', $id_repuesto);
                $stmt->execute();
                $item = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($item) {
                    http_response_code(200);
                    echo json_encode(["status" => "success", "data" => $item]);
                } else {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "message" => "Item no encontrado"]);
                }
            } else {
                // Listar todos los items
                $sql = "SELECT * FROM Repuestos_Inventario ORDER BY nombre_pieza ASC";
                $stmt = $conexion->prepare($sql);
                $stmt->execute();
                $inventario = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                http_response_code(200);
                echo json_encode(["status" => "success", "data" => $inventario]);
            }
            break;

        // -------------
        // CASO POST (Crear Nuevo Item)
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            // Validar campos obligatorios
            if (empty($datos['codigo_sku']) || empty($datos['nombre_pieza']) || !isset($datos['precio_venta']) || !isset($datos['stock'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "SKU, Nombre, Precio y Stock son obligatorios"]);
                exit; 
            }

            $sql = "INSERT INTO Repuestos_Inventario (codigo_sku, nombre_pieza, descripcion, precio_venta, stock, categoria) 
                    VALUES (:codigo_sku, :nombre_pieza, :descripcion, :precio_venta, :stock, :categoria)";
            
            $stmt = $conexion->prepare($sql);
            
            $stmt->bindParam(':codigo_sku', $datos['codigo_sku']);
            $stmt->bindParam(':nombre_pieza', $datos['nombre_pieza']);
            $stmt->bindParam(':descripcion', $datos['descripcion']);
            $stmt->bindParam(':precio_venta', $datos['precio_venta']);
            $stmt->bindParam(':stock', $datos['stock']);
            $stmt->bindParam(':categoria', $datos['categoria']); // Categoria (Repuesto, Accesorio, etc.)

            $stmt->execute();
            
            $id_nuevo = $conexion->lastInsertId(); 
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Item de inventario creado", "id_repuesto" => $id_nuevo]);
            break;

        // -------------
        // CASO PUT (Actualizar Item)
        // -------------
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de item"]);
                exit;
            }
            $id_repuesto = $_GET['id'];
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['codigo_sku']) || empty($datos['nombre_pieza']) || !isset($datos['precio_venta']) || !isset($datos['stock'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "SKU, Nombre, Precio y Stock son obligatorios"]);
                exit; 
            }

            $sql = "UPDATE Repuestos_Inventario SET 
                        codigo_sku = :codigo_sku, 
                        nombre_pieza = :nombre_pieza, 
                        descripcion = :descripcion, 
                        precio_venta = :precio_venta, 
                        stock = :stock, 
                        categoria = :categoria 
                    WHERE id_repuesto = :id_repuesto";
            
            $stmt = $conexion->prepare($sql);
            
            $stmt->bindParam(':codigo_sku', $datos['codigo_sku']);
            $stmt->bindParam(':nombre_pieza', $datos['nombre_pieza']);
            $stmt->bindParam(':descripcion', $datos['descripcion']);
            $stmt->bindParam(':precio_venta', $datos['precio_venta']);
            $stmt->bindParam(':stock', $datos['stock']);
            $stmt->bindParam(':categoria', $datos['categoria']);
            $stmt->bindParam(':id_repuesto', $id_repuesto);

            $stmt->execute();
            
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "message" => "Item actualizado correctamente"]);
            break;

        // -------------
        // CASO DELETE (Borrar Item)
        // -------------
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de item"]);
                exit;
            }
            $id_repuesto = $_GET['id'];
            
            // Cuidado: Si el item está en una Orden de Servicio, no se podrá borrar.
            
            $sql = "DELETE FROM Repuestos_Inventario WHERE id_repuesto = :id_repuesto";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':id_repuesto', $id_repuesto);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200); 
                echo json_encode(["status" => "success", "message" => "Item borrado correctamente"]);
            } else {
                http_response_code(404); 
                echo json_encode(["status" => "error", "message" => "No se encontró el item"]);
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
