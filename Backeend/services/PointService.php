<?php
require_once __DIR__ . '/../models/CollectionPoint.php';

class PointService {
    public static function all($db){
        return CollectionPoint::all($db);
    }

    public static function create($db,$data){
        CollectionPoint::create($db,$data);
    }
}