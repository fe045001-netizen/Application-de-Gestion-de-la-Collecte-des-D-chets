<?php
require_once __DIR__ . '/../models/CollectionRoute.php';

class RouteService {
    public static function all($db){
        return CollectionRoute::all($db);
    }

    public static function create($db,$data){
        CollectionRoute::create($db,$data);
    }
}