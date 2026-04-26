<?php
require_once __DIR__ . '/../config/database.php';

class PointController {

    public static function getAll() {
        $db   = (new Database())->connect();
        $cols = self::getColumns($db, "collection_points");

        $selectCols = ["id", "name"];
        if (in_array("latitude",  $cols)) $selectCols[] = "latitude";
        if (in_array("longitude", $cols)) $selectCols[] = "longitude";
        if (in_array("zone",      $cols)) $selectCols[] = "zone";
        if (in_array("type",      $cols)) $selectCols[] = "type";
        if (in_array("status",    $cols)) $selectCols[] = "status";
        if (in_array("route_id",  $cols)) $selectCols[] = "route_id";

        $sql  = "SELECT " . implode(", ", $selectCols) . " FROM collection_points ORDER BY id ASC";
        $stmt = $db->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $rows = array_map(function($p) {
            return [
                "id"       => (int)$p['id'],
                "name"     => $p['name']     ?? "",
                "latitude" => isset($p['latitude'])  ? (float)$p['latitude']  : 0,
                "longitude"=> isset($p['longitude']) ? (float)$p['longitude'] : 0,
                "zone"     => $p['zone']     ?? "",
                "type"     => $p['type']     ?? "conteneur",
                "status"   => $p['status']   ?? "actif",
                "route_id" => isset($p['route_id']) && $p['route_id'] ? (int)$p['route_id'] : null,
            ];
        }, $rows);

        echo json_encode($rows);
    }

    public static function create() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['name'])) {
            http_response_code(400);
            echo json_encode(["error" => "Le champ name est requis"]);
            return;
        }

        // Ajouter route_id si la colonne existe
        $cols = self::getColumns($db, "collection_points");
        self::ensureRouteIdColumn($db, $cols);
        $cols = self::getColumns($db, "collection_points"); // re-fetch après ALTER

        $routeId = isset($data['route_id']) && $data['route_id'] ? (int)$data['route_id'] : null;

        if (in_array("route_id", $cols)) {
            $stmt = $db->prepare("
                INSERT INTO collection_points (name, latitude, longitude, zone, type, status, route_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                (float)($data['latitude']  ?? $data['lat']  ?? 0),
                (float)($data['longitude'] ?? $data['lng']  ?? 0),
                $data['zone']   ?? "",
                $data['type']   ?? "conteneur",
                $data['status'] ?? "actif",
                $routeId,
            ]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO collection_points (name, latitude, longitude, zone, type, status)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['name'],
                (float)($data['latitude']  ?? 0),
                (float)($data['longitude'] ?? 0),
                $data['zone']   ?? "",
                $data['type']   ?? "conteneur",
                $data['status'] ?? "actif",
            ]);
        }

        http_response_code(201);
        echo json_encode(["success" => true, "id" => (int)$db->lastInsertId()]);
    }

    public static function update($id) {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        // S'assurer que route_id existe
        $cols = self::getColumns($db, "collection_points");
        self::ensureRouteIdColumn($db, $cols);
        $cols = self::getColumns($db, "collection_points");

        $routeId = array_key_exists('route_id', $data)
            ? ($data['route_id'] ? (int)$data['route_id'] : null)
            : null; // null = effacer

        // Si seul route_id est envoyé (assignation depuis RoutesPage)
        if (count($data) === 1 && array_key_exists('route_id', $data)) {
            $stmt = $db->prepare("UPDATE collection_points SET route_id = ? WHERE id = ?");
            $stmt->execute([$routeId, (int)$id]);
            echo json_encode(["success" => true]);
            return;
        }

        // Mise à jour complète
        if (in_array("route_id", $cols)) {
            $stmt = $db->prepare("
                UPDATE collection_points
                SET name = ?, latitude = ?, longitude = ?, zone = ?, type = ?, status = ?, route_id = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['name']     ?? "",
                (float)($data['latitude']  ?? $data['lat'] ?? 0),
                (float)($data['longitude'] ?? $data['lng'] ?? 0),
                $data['zone']     ?? "",
                $data['type']     ?? "conteneur",
                $data['status']   ?? "actif",
                $routeId,
                (int)$id,
            ]);
        } else {
            $stmt = $db->prepare("
                UPDATE collection_points
                SET name = ?, latitude = ?, longitude = ?, zone = ?, type = ?, status = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['name']     ?? "",
                (float)($data['latitude']  ?? 0),
                (float)($data['longitude'] ?? 0),
                $data['zone']     ?? "",
                $data['type']     ?? "conteneur",
                $data['status']   ?? "actif",
                (int)$id,
            ]);
        }

        echo json_encode(["success" => true]);
    }

    public static function delete($id) {
        $db = (new Database())->connect();
        // Supprimer les logs liés
        try {
            $db->prepare("DELETE FROM collection_logs WHERE point_id = ?")->execute([(int)$id]);
        } catch (Exception $e) {}
        $db->prepare("DELETE FROM collection_points WHERE id = ?")->execute([(int)$id]);
        echo json_encode(["success" => true]);
    }

    // ── Ajouter route_id si elle n'existe pas encore ──────────────────────
    private static function ensureRouteIdColumn($db, $cols) {
        if (!in_array("route_id", $cols)) {
            try {
                $db->exec("ALTER TABLE collection_points ADD COLUMN route_id INT NULL");
                $db->exec("ALTER TABLE collection_points ADD COLUMN status VARCHAR(50) DEFAULT 'actif'");
            } catch (Exception $e) { /* colonne existe déjà */ }
        }
    }

    private static function getColumns($db, $table) {
        $stmt = $db->query("DESCRIBE `$table`");
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), "Field");
    }
}