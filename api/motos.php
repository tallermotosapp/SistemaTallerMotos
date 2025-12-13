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
                $id_moto = $_GET['id'];
                // La consulta también hace JOIN para tener el ID del cliente
                $sql = "SELECT 
                            m.id_moto, m.placa, m.marca, m.modelo, m.anio, m.color, m.cilindrada,
                            m.id_cliente_fk 
                        FROM Motos AS m
                        WHERE m.id_moto = :id_moto";
                
                $stmt = $conexion->prepare($sql);
                $stmt->bindParam(':id_moto', $id_moto);
                $stmt->execute();
                
                $moto = $stmt->fetch(PDO::FETCH_ASSOC); // fetch (uno solo)
                
                if ($moto) {
                    http_response_code(200); // OK
                    echo json_encode(["status" => "success", "data" => $moto]);
                } else {
                    http_response_code(404); // Not Found
                    echo json_encode(["status" => "error", "message" => "Moto no encontrada"]);
                }

            } else {
                // MODIFICADO: Esto era lo que tenías antes (listar todas)
                $sql = "SELECT 
                            m.id_moto, m.placa, m.marca, m.modelo, m.anio, m.color, m.cilindrada,
                            c.id_cliente, c.nombre, c.apellido 
                        FROM Motos AS m
                        JOIN Clientes AS c ON m.id_cliente_fk = c.id_cliente
                        ORDER BY c.apellido, m.placa";
                
                $stmt = $conexion->prepare($sql);
                $stmt->execute();
                $motos = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                http_response_code(200); // OK
                echo json_encode(["status" => "success", "data" => $motos]);
            }
            break;

        // -------------
        // CASO POST (Crear Nueva Moto) - Sin cambios
        // -------------
        case 'POST':
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['placa']) || empty($datos['marca']) || empty($datos['id_cliente_fk'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Placa, Marca y Cliente son obligatorios"]);
                exit; 
            }

            $sql = "INSERT INTO Motos (placa, marca, modelo, anio, color, cilindrada, id_cliente_fk) 
                    VALUES (:placa, :marca, :modelo, :anio, :color, :cilindrada, :id_cliente_fk)";
            
            $stmt = $conexion->prepare($sql);
            
            $stmt->bindParam(':placa', $datos['placa']);
            $stmt->bindParam(':marca', $datos['marca']);
            $stmt->bindParam(':modelo', $datos['modelo']);
            $stmt->bindParam(':anio', $datos['anio']);
            $stmt->bindParam(':color', $datos['color']);
            $stmt->bindParam(':cilindrada', $datos['cilindrada']);
            $stmt->bindParam(':id_cliente_fk', $datos['id_cliente_fk']);

            $stmt->execute();
            
            $id_nuevo = $conexion->lastInsertId(); 
            http_response_code(201); // Created
            echo json_encode(["status" => "success", "message" => "Moto creada correctamente", "id_moto" => $id_nuevo]);
            break;

        // -------------
        // CASO PUT (Actualizar Moto) - Sin cambios
        // -------------
        case 'PUT':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de moto"]);
                exit;
            }
            $id_moto = $_GET['id'];
            $datos = json_decode(file_get_contents('php://input'), true);

            if (empty($datos['placa']) || empty($datos['marca']) || empty($datos['id_cliente_fk'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "Placa, Marca y Cliente son obligatorios"]);
                exit; 
            }

            $sql = "UPDATE Motos SET 
                        placa = :placa, 
                        marca = :marca, 
                        modelo = :modelo, 
                        anio = :anio, 
                        color = :color, 
                        cilindrada = :cilindrada, 
                        id_cliente_fk = :id_cliente_fk 
                    WHERE id_moto = :id_moto";
            
            $stmt = $conexion->prepare($sql);
            
            $stmt->bindParam(':placa', $datos['placa']);
            $stmt->bindParam(':marca', $datos['marca']);
            $stmt->bindParam(':modelo', $datos['modelo']);
            $stmt->bindParam(':anio', $datos['anio']);
            $stmt->bindParam(':color', $datos['color']);
            $stmt->bindParam(':cilindrada', $datos['cilindrada']);
            $stmt->bindParam(':id_cliente_fk', $datos['id_cliente_fk']);
            $stmt->bindParam(':id_moto', $id_moto);

            $stmt->execute();
            
            http_response_code(200); // OK
            echo json_encode(["status" => "success", "message" => "Moto actualizada correctamente"]);
            break;

        // -------------
        // CASO DELETE (Borrar Moto) - Sin cambios
        // -------------
        case 'DELETE':
            if (!isset($_GET['id'])) {
                http_response_code(400); 
                echo json_encode(["status" => "error", "message" => "No se proporcionó un ID de moto"]);
                exit;
            }
            $id_moto = $_GET['id'];
            
            $sql = "DELETE FROM Motos WHERE id_moto = :id_moto";
            $stmt = $conexion->prepare($sql);
            $stmt->bindParam(':id_moto', $id_moto);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                http_response_code(200); 
                echo json_encode(["status" => "success", "message" => "Moto borrada correctamente"]);
            } else {
                http_response_code(404); 
                echo json_encode(["status" => "error", "message" => "No se encontró la moto"]);
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