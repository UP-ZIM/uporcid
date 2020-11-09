<?php
namespace UniPotsdam\Orcid\CslPhp;

use UniPotsdam\Orcid\CslPhp\EditorGroup;
use SimpleXMLElement;

/**
 * --------------------------------------------------------------
 * This file is part of the package UniPotsdam\Orcid.
 * copyright 2020 by University Potsdam
 * https://www.uni-potsdam.de/
 *
 * Project: Orcid Extension
 * User: Anuj Sharma (asharma@uni-potsdam.de)
 *
 * --------------------------------------------------------------
 */

class Literal{
    public function literalConvert($json, $style){
        $cititation = null;
        // echo '<pre>';
        // print_r($json);
        // echo '</pre><br><br>////////////////////////////////////////////////';
        $data = json_decode($json);
        $resArr = array();
        foreach ($data as $dataKey => $dataVal) {
            $auth = $dataVal->author;
            $newVal = $this->author($auth);
            $existsKey = $this->authorKeyexists($auth);
            if ($existsKey != true){
                $dataVal->author = $newVal;
            }
            array_push($resArr, $dataVal);
        }
        return $resArr;
    }
    protected function author($data){
        foreach($data as $dataKey => $dataVal){
            if(!isset($dataVal->family) && !isset($dataVal->given)){
                return $this->literalSplit($dataVal->literal);
            }
        }
    }

    protected function authorKeyexists($auth){
        foreach($auth as $authKey => $authVal){
            if (isset($authVal->family)){
                return true;
            }

        }
    }
    protected function literalSplit($lit){
        $litSplit =  explode(" and ", $lit);
        $resArr = array();
        foreach($litSplit as $litSplitKey => $litSplitVal){
            $authArr = new \stdClass();
            $authSplit=  explode(" ", $litSplitVal);
            $given=$authSplit[0];
            $rest=ltrim($litSplitVal, $given.' ');
            if(empty($rest)){
                $authArr->family = '';
            }else{
                $authArr->family = $rest;
            }
            $authArr->given = $given;
            array_push($resArr, $authArr);
        }
        return $resArr;
    }
}