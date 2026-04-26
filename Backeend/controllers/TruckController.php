<?php
require_once __DIR__ . '/../config/database.php';

class TruckController {

    // GET /api/trucks → retourne tous les camions
    // Normalise les colonnes pour React : toujours retourner plate et model
    public static function getAll() {
        $db = (new Database())->connect();

        // Lire les vraies colonnes de la table
        $stmt = $db->query("SELECT * FROM trucks ORDER BY id ASC");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Normaliser pour React (quel que soit le nom de colonne en DB)
        $result = array_map(function($t) {
            return [
                "id"       => $t['id'],
                "plate"    => $t['plate']    ?? $t['plate_number']  ?? $t['immatriculation'] ?? "",
                "model"    => $t['model']    ?? $t['name']           ?? $t['marque']          ?? "",
                "capacity" => $t['capacity'] ?? 0,
                "status"   => $t['status']   ?? "actif",
                "driver_id"=> $t['driver_id'] ?? null,
            ];
        }, $rows);

        echo json_encode($result);
    }

    // POST /api/trucks
    public static function create() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        // Accepter plate ou plate_number, model ou name
        $plate    = $data['plate']    ?? $data['plate_number']  ?? "";
        $model    = $data['model']    ?? $data['name']           ?? "";
        $capacity = (int)($data['capacity'] ?? 0);
        $status   = $data['status']   ?? "actif";

        if (!$plate || !$model) {
            http_response_code(400);
            echo json_encode(["error" => "Champs requis : plate, model"]);
            return;
        }

        // Détecter quelles colonnes existent dans la table
        $cols = self::getColumns($db, "trucks");

        $plateCol = in_array("plate", $cols) ? "plate" : (in_array("plate_number", $cols) ? "plate_number" : "plate");
        $modelCol = in_array("model", $cols) ? "model" : (in_array("name", $cols) ? "name" : "model");

        $stmt = $db->prepare("INSERT INTO trucks ($plateCol, $modelCol, capacity, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$plate, $model, $capacity, $status]);

        http_response_code(201);
        echo json_encode(["success" => true, "id" => (int) $db->lastInsertId()]);
    }

    // PUT /api/trucks/{id}
    public static function update($id) {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        $plate    = $data['plate']    ?? $data['plate_number']  ?? "";
        $model    = $data['model']    ?? $data['name']           ?? "";
        $capacity = (int)($data['capacity'] ?? 0);
        $status   = $data['status']   ?? "actif";

        $cols     = self::getColumns($db, "trucks");
        $plateCol = in_array("plate", $cols) ? "plate" : (in_array("plate_number", $cols) ? "plate_number" : "plate");
        $modelCol = in_array("model", $cols) ? "model" : (in_array("name", $cols) ? "name" : "model");

        $stmt = $db->prepare("UPDATE trucks SET $plateCol=?, $modelCol=?, capacity=?, status=? WHERE id=?");
        $stmt->execute([$plate, $model, $capacity, $status, (int)$id]);

        echo json_encode(["success" => true]);
    }

    // DELETE /api/trucks/{id}
    public static function delete($id) {
        $db   = (new Database())->connect();
        $stmt = $db->prepare("DELETE FROM trucks WHERE id=?");
        $stmt->execute([(int)$id]);
        echo json_encode(["success" => true]);
    }

    // Helper : lister les colonnes d'une table
    private static function getColumns($db, $table) {
        $stmt = $db->query("DESCRIBE $table");
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), "Field");
    }
}