<?php
class CollectionPoint {
    public static function all($db){
        return $db->query("SELECT * FROM collection_points")
                  ->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function create($db,$data){
        $stmt=$db->prepare("
            INSERT INTO collection_points(name,latitude,longitude,zone,type)
            VALUES(?,?,?,?,?)
        ");
        $stmt->execute([
            $data['name'],$data['latitude'],$data['longitude'],
            $data['zone'],$data['type']
        ]);
    }
}