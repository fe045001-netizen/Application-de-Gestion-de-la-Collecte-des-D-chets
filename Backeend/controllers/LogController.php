<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

class LogController {

    // GET /api/logs → tous les logs
    public static function getAll() {
        $db   = (new Database())->connect();
        $stmt = $db->query("SELECT * FROM collection_logs ORDER BY id DESC");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // POST /api/logs → créer un log
    public static function create() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['point_id'], $data['route_id'], $data['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "Champs requis : point_id, route_id, status"]);
            return;
        }

        $timestamp = $data['timestamp'] ?? date("Y-m-d H:i:s");

        $stmt = $db->prepare("
            INSERT INTO collection_logs (point_id, route_id, status, note, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ");

        $success = $stmt->execute([
            (int) $data['point_id'],
            (int) $data['route_id'],
            $data['status'],
            $data['note'] ?? "",
            $timestamp,
        ]);

        if ($success) {
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "id"      => (int) $db->lastInsertId(),
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Insertion échouée"]);
        }
    }

    // PUT /api/logs/{id} → modifier statut et note
    public static function update($id) {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['status'])) {
            http_response_code(400);
            echo json_encode(["error" => "Champ requis : status"]);
            return;
        }

        $stmt = $db->prepare("
            UPDATE collection_logs
            SET status = ?, note = ?
            WHERE id = ?
        ");

        $success = $stmt->execute([
            $data['status'],
            $data['note'] ?? "",
            (int) $id,
        ]);

        if ($success && $stmt->rowCount() > 0) {
            echo json_encode(["success" => true, "id" => (int) $id]);
        } elseif ($success && $stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(["error" => "Log introuvable (id=$id)"]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Mise à jour échouée"]);
        }
    }
}