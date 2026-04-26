<?php
class PositionController {
    private static function getFile() {
        return __DIR__ . '/../positions_data.json';
    }

    public static function getAll() {
        $file = self::getFile();
        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        echo json_encode(array_values($data ?: []));
    }

    public static function save() {
        $file = self::getFile();
        $body = json_decode(file_get_contents("php://input"), true);

        if (!$body || !isset($body['lat'], $body['lng'])) {
            http_response_code(400);
            echo json_encode(["error" => "Données invalides"]);
            return;
        }

        $data = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
        if (!is_array($data)) $data = [];

        $uid = $body['user_id'] ?? 'unknown';
        $data[$uid] = [
            "user_id"   => $uid,
            "user_name" => $body['user_name'] ?? 'Chauffeur',
            "lat"       => floatval($body['lat']),
            "lng"       => floatval($body['lng']),
            "route_id"  => $body['route_id'] ?? null,
            "timestamp" => date('c'),
        ];

        file_put_contents($file, json_encode($data));
        echo json_encode(["ok" => true]);
    }
}