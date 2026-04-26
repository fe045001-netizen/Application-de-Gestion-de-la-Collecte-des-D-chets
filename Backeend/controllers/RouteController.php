<?php
require_once __DIR__ . '/../config/database.php';

class RouteController {

    public static function getAll() {
        $db   = (new Database())->connect();
        $cols = self::getColumns($db, "collection_routes");

        $selectCols = ["id", "name", "date", "status"];
        if (in_array("truck_id",   $cols)) $selectCols[] = "truck_id";
        if (in_array("truck_name", $cols)) $selectCols[] = "truck_name";
        if (in_array("driver_id",  $cols)) $selectCols[] = "driver_id";

        $sql  = "SELECT " . implode(", ", $selectCols) . " FROM collection_routes ORDER BY date DESC";
        $stmt = $db->query($sql);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $rows = array_map(function($r) {
            $r['truck_id']  = isset($r['truck_id'])  && $r['truck_id']  ? (int)$r['truck_id']  : null;
            $r['driver_id'] = isset($r['driver_id']) && $r['driver_id'] ? (int)$r['driver_id'] : null;
            return $r;
        }, $rows);

        echo json_encode($rows);
    }

    public static function create() {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['name']) || empty($data['date'])) {
            http_response_code(400);
            echo json_encode(["error" => "name et date requis"]);
            return;
        }

        $cols     = self::getColumns($db, "collection_routes");
        $truckId  = isset($data['truck_id'])  && $data['truck_id']  ? (int)$data['truck_id']  : null;
        $driverId = isset($data['driver_id']) && $data['driver_id'] ? (int)$data['driver_id'] : null;

        $fields = ["name", "date", "status"];
        $values = [$data['name'], $data['date'], $data['status'] ?? 'planifiee'];
        $ph     = ["?", "?", "?"];

        if (in_array("truck_id",  $cols)) { $fields[] = "truck_id";  $values[] = $truckId;  $ph[] = "?"; }
        if (in_array("driver_id", $cols)) { $fields[] = "driver_id"; $values[] = $driverId; $ph[] = "?"; }

        $stmt = $db->prepare("INSERT INTO collection_routes (" . implode(",", $fields) . ") VALUES (" . implode(",", $ph) . ")");
        $stmt->execute($values);

        http_response_code(201);
        echo json_encode(["success" => true, "id" => (int)$db->lastInsertId()]);
    }

    public static function update($id) {
        $db   = (new Database())->connect();
        $data = json_decode(file_get_contents("php://input"), true);

        if (!$data) {
            http_response_code(400);
            echo json_encode(["error" => "Donnees invalides"]);
            return;
        }

        $cols     = self::getColumns($db, "collection_routes");
        $truckId  = isset($data['truck_id'])  && $data['truck_id']  ? (int)$data['truck_id']  : null;
        $driverId = isset($data['driver_id']) && $data['driver_id'] ? (int)$data['driver_id'] : null;

        $set    = ["name=?", "status=?", "date=?"];
        $values = [$data['name'] ?? '', $data['status'] ?? 'planifiee', $data['date'] ?? date('Y-m-d')];

        if (in_array("truck_id",  $cols)) { $set[] = "truck_id=?";  $values[] = $truckId; }
        if (in_array("driver_id", $cols)) { $set[] = "driver_id=?"; $values[] = $driverId; }

        $values[] = (int)$id;
        $stmt = $db->prepare("UPDATE collection_routes SET " . implode(",", $set) . " WHERE id=?");
        $stmt->execute($values);

        echo json_encode(["success" => true, "id" => (int)$id]);
    }

    public static function delete($id) {
        $db = (new Database())->connect();
        try { $db->prepare("DELETE FROM collection_logs WHERE route_id=?")->execute([(int)$id]); } catch(Exception $e){}
        $db->prepare("DELETE FROM collection_routes WHERE id=?")->execute([(int)$id]);
        echo json_encode(["success" => true]);
    }

    private static function getColumns($db, $table) {
        $stmt = $db->query("DESCRIBE `$table`");
        return array_column($stmt->fetchAll(PDO::FETCH_ASSOC), "Field");
    }
}