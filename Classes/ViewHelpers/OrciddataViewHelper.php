<?php
namespace UniPotsdam\Orcid\ViewHelpers;
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

use TYPO3Fluid\Fluid\Core\Rendering\RenderingContextInterface;
use TYPO3Fluid\Fluid\Core\ViewHelper\Traits\CompileWithRenderStatic;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Database\Connection;
use UniPotsdam\Orcid\CslPhp\Literal;

class OrciddataViewHelper extends \TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper {


    //initaliz atttribute for viewhelper tag of html template 
    public function initializeArguments()
    {
        $this->registerArgument('uid', 'string', 'uid use to get orcid id', true);
        $this->registerArgument('orcidstyle', 'string', 'Apply Citation Style on Orcid data', true);
    }
	
	

    //Render Function for Orcid Data
    public static function renderStatic(
        array $arguments,
        \Closure $renderChildrenClosure,
        RenderingContextInterface $renderingContext
    ) {
        $uid          = $arguments['uid'];
        $orcidstyle       = $arguments['orcidstyle'];
        $orcididarr[]       = $uid;
        $apiurl = unserialize($GLOBALS['TYPO3_CONF_VARS']['EXT']['extConf']['orcid']);
        $apiurl = $apiurl['inputApiurl'];
        
        //Initialize query to get Orcid data from tx_orcid table
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');

        //Get all data from tx_orcid_workdata table
        $cond_orcid_data = $queryBuilder->select('orcid_id')->from('tx_orcid')->execute();
        $cond_orcid_data = $cond_orcid_data->fetchAll();


        //Initialize query to get Orcid data from tx_orcid table
        $qurBuildwork = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');

        
        // Create array for orcid data nd work data 
        $orcidXml = array();
        $workxml = array();
        foreach ($orcididarr as $orid => $idval) {
            $tabledata = $queryBuilder->select('orcid_data')->from('tx_orcid')->where($queryBuilder->expr()->eq('orcid_id', $queryBuilder->createNamedParameter($idval)))->execute();
            
            $work_data = $qurBuildwork->select('orcid_work_data', 'tstamp')->from('tx_orcid_workdata')->where($qurBuildwork->expr()->eq('orcid_id', $qurBuildwork->createNamedParameter($idval)))->addOrderBy('orcid_work_date', 'DESC')->execute();
            $work_rowd = $work_data->fetchAll();
            $work_arr = array();
            foreach ($work_rowd as $work_rowd_key => $work_rowd_val) {
                $objworkarr = json_decode($work_rowd_val['orcid_work_data']);
                if (!array_key_exists('responseCode', $objworkarr) && !array_key_exists('response-code', $objworkarr)) {
                    array_push($work_arr, $objworkarr);
                }
                
            }
            
            $workxml[$idval] = json_encode($work_arr);
            
            while ($row = $tabledata->fetch()) {
                $orcidData = $row['orcid_data'];            
            }
            $orcidXml[$idval] = $orcidData;
        }

        $quer = self::convertJSon($orcidXml);
        $auth_name = self::getAuthor($orcidXml);

        //$work_json = $work_data->literalConvert($workxml);

        //return true;
        return self::applyCsl($workxml, $orcidstyle, $auth_name);


    }    
	
	/**
     * @param string $resid
     * @param string $content
	 */    
    // Insert and update Query for orcid data
    public static function msQuery($resid, $content){
        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');
        $oid = $queryBuilder->select('uid')->from('tx_orcid')->where($queryBuilder->expr()->eq('orcid_id', $queryBuilder->createNamedParameter($resid)))->execute();
        $row = $oid->fetch();
        $uid = $row['uid'];
        if($row['uid']){

            //update according to orcid ID
            GeneralUtility::makeInstance(ConnectionPool::class)
            ->getConnectionForTable('tx_orcid')
            ->update(
                'tx_orcid',
                ['orcid_data' => $content],
                ['uid' => $uid]
            );
        } else{
            //Insert Orcid Id in tx_orcid table
            $queryBuilder->insert('tx_orcid')->values(['orcid_id' => $resid,'orcid_data' => $content])->execute();
        }
    }

	/**
     * @param string $result
	 * Get author Name from XMl content
	 */ 
    public static function getAuthor($result){
        //Initialize Json array
        $auth_arr=array();

        //Break the array and convert into json format
        foreach($result as $rid => $data){

            //Convert XML to Array
            $xml=preg_replace('/<([^>]*?)-([^>]*?)>/', '<$1$2>',$data);
            $xml = preg_replace("/(<\/?)(\w+):([^>]*>)/", "$1$2$3", $xml);
            $xml=preg_replace('/<([^>]*?)-([^>]*?)>/', '<$1$2>',$xml);
            $ob = simplexml_load_string($xml);
            $objdata = $ob->{'personperson'}->{'personname'};
            $result_array=array();
            foreach($objdata as $objdata_key => $objdata_key_val){ 
                //Given Name
                $first_name = $objdata_key_val->personaldetailsgivennames;
                foreach ($first_name as $first_name_key => $first_name_value) {
                    $f_name = $first_name_value;
                }

                //Family Name
                $last_name = $objdata_key_val->personaldetailsfamilyname;
                foreach ($last_name as $last_name_key => $last_name_value) {
                    $l_nama = $last_name_value;
                }

                $auth_arr[$rid] = $f_name.' '.$l_nama;
                
            }

        }

        return $auth_arr;
    }

	/**
     * @param string $res
     * @param string $style
     * @param string $author
	 */
    //Apply Citation Style library on orcid XMl data
    public static function applyCsl($res, $style, $author){
        $csltext = array();
        foreach($res as $rid => $data){
            $work_data = new Literal();
            $data1 = $work_data->literalConvert($data, $style);
            $data1 = json_encode($data1);
            $data1 = addslashes($data1);

            $auth_name = '<h2>'.$author[$rid].'</h2>';
            $csltextarr=[];
            $csltextarr['author']= strval($auth_name);
            $csltextarr['jsonData']= strval($data1);
            
            array_push($csltext, $csltextarr);
            // array_push($csltext['jsonData'], strval($data1));
        }
        //print_r($csltext);
        return $csltext;
        
    }

	/**
     * @param string $idval
	 */
    //Get Orcid id from tx_orcid_page table
    public static function orcidIds($idval){

        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_page');
        $tabledata = $queryBuilder->select('orcid_id')->from('tx_orcid_page')->where($queryBuilder->expr()->eq('orcid_id_data', $queryBuilder->createNamedParameter($idval)))->execute();
        
        //initializ Orcid array
        $orcidid = array();
        while ($row = $tabledata->fetch()) {
            $orcid_data = $row['orcid_id'];
            
            array_push($orcidid, $orcid_data);       
        }

        return $orcidid;
    }
	
	/**
     * @param string $qurBuildwork
     * @param string $url
     * @param string $data
	 * Get Orcid post data from tx_orcid_workdata
	 */
    public static function workDataApi($qurBuildwork, $url, $data){

        //Get all data from tx_orcid_workdata table
        $cond_work_data = $qurBuildwork->select('orcid_workput_code')->from('tx_orcid_workdata')->execute();
        $cond_work_data = $cond_work_data->fetchAll();

        foreach ($data as $datakey => $datavalue) {
            foreach ($datavalue as $workkey => $workvalue) {
                if (array_search($workid, array_column($cond_work_data, 'orcid_workput_code')) != TRUE){
                    $curl = curl_init();
                    $headers = array(
                        'Accept: application/vnd.citationstyles.csl+json'
                    );

                    curl_setopt($curl, CURLOPT_URL, $url.$workvalue['path']);
                    curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
                    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
                    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

                    $result = curl_exec($curl);
                    if(!$result){die("Connection Failure");}
                    curl_close($curl);

                    $workid = $workvalue['id'];
                    $workyear = $workvalue['year'];
                    $orcid_id = explode("/",strval($workvalue['path']));
                    $orcid_id = $orcid_id[1];

                //condition if work is already exist in tx_orcid_workdata table 
                
                    self::workDataQuery($workid, $result, $orcid_id, $workyear);
                }
                
            }
            
        }
    }

    public static function workDataQuery($workid, $work_content, $orcid_id, $workyear){
        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');
        $oid = $queryBuilder->select('uid','orcid_workput_code')->from('tx_orcid_workdata')->where($queryBuilder->expr()->eq('orcid_workput_code', $queryBuilder->createNamedParameter($workid)))->execute();
        $row = $oid->fetch();
        $uid = $row['uid'];
        if($row['orcid_workput_code'] == $workid){

            //update according to orcid ID
            GeneralUtility::makeInstance(ConnectionPool::class)
            ->getConnectionForTable('tx_orcid_workdata')
            ->update(
                'tx_orcid_workdata',
                ['orcid_id' => $orcid_id],
                ['orcid_work_data' => $work_content],
                ['orcid_work_date' => $workyear],
                ['uid' => $uid]
            );
        } else{
            //Insert Orcid Id in tx_orcid table
            $queryBuilder->insert('tx_orcid_workdata')->values(['orcid_workput_code' => $workid, 'orcid_id' => $orcid_id, 'orcid_work_date' => $workyear, 'orcid_work_data' => $work_content])->execute();
        }
    }


    //Function for the convert xml to json format according to the CSL PHP library
    public static function convertJSon($result){
        
        //Initialize Json array
        $json_array=array();

        //Break the array and convert into json format
        foreach($result as $rid => $data){

            //Convert XML to Array
            $xml = preg_replace("/(<\/?)(\w+):([^>]*>)/", "$1$2_$3", $data);
            $ob = simplexml_load_string($xml);
            $objdata = $ob->{'activities_activities-summary'}->{'activities_works'};
            $result_array=array();
            $prpost = [];
            foreach($objdata as $objdata_key => $objdata_key_val){ 
                foreach ($objdata_key_val as $act_grp => $act_grp_val) {    
                    if($act_grp == 'activities_group'){
                        foreach ($act_grp_val as $worksum => $worksum_val) {
                            
                            $prtitle = $prpost->work_title->common_title;
                            $curtitle =  $worksum_val->work_title->common_title;
                            
                            if($worksum == 'work_work-summary' && strval($prtitle) !== strval($curtitle) ){
                                
                                $work = array();
                                $work['id']              = strval($worksum_val['put-code']);
                                $work['path']            = strval($worksum_val['path']);
                                $work['year']            = strval($worksum_val->{'common_publication-date'}->common_year);
                                $work['title']            = strval($worksum_val->work_title->common_title);
                                array_push($result_array,$work)	;   
                                
                            }
                            $prpost = $worksum_val;
                            
                        }
                        
                    }    
                }
            }

            
            // $cls = json_encode($result_array);
            //var_dump($cls);
            // echo '<BR><BR><pre>';
            // print_r($result_array);
            // echo '</pre>';
            
            array_push($json_array,$result_array)	;

        }

        return $json_array;
    }
}
