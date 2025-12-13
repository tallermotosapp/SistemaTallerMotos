<?php


$db_host = "localhost";    
$db_user = "root";        
$db_pass = "";             
$db_name = "taller_motos_db"; 

// 2. Configuración de la respuesta (Cabeceras)
// Le dice al navegador que la respuesta será en formato JSON y que permita 
// peticiones desde cualquier origen (CORS - Cross-Origin Resource Sharing).
// Esto es vital para que nuestro index.html (en localhost) pueda hablar 
// con nuestra api (también en localhost).
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

/* --- INICIA CONEXIÓN --- */
try {
    // Crear la conexión usando PDO (PHP Data Objects)
    // PDO es más moderno y seguro que mysqli para manejar 'prepared statements'.
    $conexion = new PDO("mysql:host={$db_host};dbname={$db_name}", $db_user, $db_pass);
    
    // Configurar PDO para que lance excepciones en caso de error
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Opcional: Configurar para que use UTF-8
    $conexion->exec("SET NAMES 'utf8'");
    
} catch (PDOException $e) {
    // Si la conexión falla, se detiene todo y se muestra un error en JSON
    http_response_code(500); // Internal Server Error
    echo json_encode(
        [
            "status" => "error",
            "message" => "Error en la conexión a la base de datos: " . $e->getMessage()
        ]
    );
    exit; // Detener la ejecución del script
}

/* * NOTA:
 * Este archivo 'conexion.php' será 'incluido' (included) por 
 * todos nuestros otros archivos de la API.
 * La variable $conexion estará disponible en ellos.
 * No cerramos la etiqueta PHP (?>) a propósito. 
 * Es una buena práctica en archivos que solo contienen PHP.
 */