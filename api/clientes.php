<?php
include 'conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

try {
    switch ($metodo) {
        
        // -------------
        // CASO GET (MODIFICADO para un solo ID o todos)
        // -------------
        case 'GET':
            // NUEVO: Verificar si se pide un ID específico
            if (isset($_GET['id'])) {
                $id_cliente = $_GET['id'];
                $sql = "SELECT * FROM Clientes WHERE id_cliente = :id_cliente";
                $stmt = $conexion->prepare($sql);
                $stmt->bindParam(':id_cliente', $id_cliente);
                $stmt->execute();
                
                $cliente = $stmt->fetch(PDO::FETCH_ASSOC); // fetch (uno solo)
                
                if ($cliente) {
                    http_response_code(200); // OK
                    echo json_encode(["status" => "success", "data" => $cliente]);
                } else {
                    http_response_code(404); // Not Found
                    echo json_encode(["status" => "error", "message" => "Cliente no encontrado"]);
                }
            } else {
                // MODIFICADO: Esto era lo que tenías antes (listar todos)
                $sql = "SELECT * FROM Clientes ORDER BY nombre ASC";
                $stmt = $conexion->prepare($sql);
                $stmt->execute();
                
                $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC); // fetchAll (todos)
                
                http_response_code(200); // OK
                echo json_encode(["status" => "success", "data" => $clientes]);
            }
            break;

        // -------------
        // CASO POST (Crear Nuevo Cliente) - Sin cambios
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['nombre']) || empty($datos['apellido'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "El nombre y el apellido son obligatorios"]);
                exit; 
            }

            $sql = "INSERT INTO Clientes (nombre, apellido, telefono, email, direccion) 
                    VALUES (:nombre, :apellido, :telefono, :email, :direccion)";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':nombre', $datos['nombre']);
            $stmt->bindParam(':apellido', $datos['apellido']);
            $stmt->bindParam(':telefono', $datos['telefono']);
            $stmt->bindParam(':email', $datos['email']);
            $stmt->bindParam(':direccion', $datos['direccion']);
            $stmt->execute();
            
            $id_nuevo = $conexion->lastInsertId(); 
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Cliente creado correctamente", "id_cliente" => $id_nuevo]);
            break;

        // -------------
        // NUEVO: CASO PUT (Actualizar Cliente)
        // -------------
        case 'PUT':
            // 1. Obtener el ID del cliente a actualizar
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de cliente"]);
                exit;
            }
            $id_cliente = $_GET['id'];

            // 2. Leer los datos JSON que vienen en el body
            $datos = json_decode(file_get_contents('php://input'), true);

            // 3. Validar
            if (empty($datos['nombre']) || empty($datos['apellido'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "El nombre y el apellido son obligatorios"]);
                exit; 
            }

            // 4. Preparar la consulta SQL
            $sql = "UPDATE Clientes SET 
                        nombre = :nombre, 
                        apellido = :apellido, 
                        telefono = :telefono, 
                        email = :email, 
                        direccion = :direccion 
                    WHERE id_cliente = :id_cliente";
            
            $stmt = $conexion->prepare($sql);
            
            // 5. Bindear valores
            $stmt->bindParam(':nombre', $datos['nombre']);
            $stmt->bindParam(':apellido', $datos['apellido']);
            $stmt->bindParam(':telefono', $datos['telefono']);
            $stmt->bindParam(':email', $datos['email']);
            $stmt->bindParam(':direccion', $datos['direccion']);
            $stmt->bindParam(':id_cliente', $id_cliente);

            // 6. Ejecutar
            $stmt->execute();
            
            // 7. Enviar respuesta
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "message" => "Cliente actualizado correctamente"]);
            break;

        // -------------
        // CASO DELETE - Sin cambios
        // -------------
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de cliente"]);
                exit;
            }
            $id_cliente = $_GET['id'];
            $sql = "DELETE FROM Clientes WHERE id_cliente = :id_cliente";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':id_cliente', $id_cliente);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200); 
                echo json_encode(["status" => "success", "message" => "Cliente borrado correctamente"]);
            } else {
                http_response_code(404); 
                echo json_encode(["status" => "error", "message" => "No se encontró el cliente"]);
            }
            break;

        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["status" => "error", "message" => "Error en la operación: " . $e->getMessage()]);
}
?>