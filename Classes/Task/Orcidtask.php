<?php
namespace UniPotsdam\Orcid\Task;

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

use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Database\Connection;

class Orcidtask extends \TYPO3\CMS\Scheduler\Task\AbstractTask {

	public function execute() {
		
		//Create Query Builder variable to get content from tx_orcid table
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');
        $statement = $queryBuilder->select('orcid_id')->from('tx_orcid')->execute();

        //Initialize query to get Orcid work data from tx_orcid_workdata table
        $qurBuildwork = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');
		
        $apiurl = unserialize($GLOBALS['TYPO3_CONF_VARS']['EXT']['extConf']['orcid']);
		$apiurl = $apiurl['inputApiurl'];

        //Curl to get data from Orcid Api
        $mh = curl_multi_init();
        while ($row = $statement->fetch()) {
            $id = $row['orcid_id'];
            $ch[$id] = curl_init();
            curl_setopt($ch[$id], CURLOPT_URL, $apiurl.'/'.$id);
            curl_setopt($ch[$id], CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch[$id], CURLOPT_RETURNTRANSFER, true);

            curl_multi_add_handle($mh, $ch[$id]);
        }

        // execute the handles
        $running = null;
        do {
            curl_multi_exec($mh, $running);
        } while($running > 0);

        // get content and remove handles
        foreach($ch as $id => $c) {
            $content = curl_multi_getcontent($c);
            self::taskMsQuery($id, $content);
            $quer = self::convertJSon($content);

            //Work Api and Query Function
            self::workDataApi($qurBuildwork, $apiurl, $quer);

            curl_multi_remove_handle($mh, $c);
            
        }

        // all done
        curl_multi_close($mh);

        //Work Api and Query Function
        //self::workDataApi($qurBuildwork, $apiurl);

        return true;
    }
	
    /**
     * @param string $qurBuildwork
     * @param string $url
     * @param string $data
	 */
	// Insert and update Query for orcid data
    public static function taskMsQuery($resid, $content){
        
        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');
        $oid = $queryBuilder->select('uid')->from('tx_orcid')->where($queryBuilder->expr()->eq('orcid_id', $queryBuilder->createNamedParameter($resid)))->execute();
        $row = $oid->fetch();
        $uid = $row['uid'];
            $queryBuilder
            ->update('tx_orcid')
            ->where(
                $queryBuilder->expr()->eq('orcid_id', $queryBuilder->createNamedParameter($resid))
            )
            ->set('orcid_data', $content)
            ->set('tstamp', time())
            ->execute();
    }
	
	/**
     * @param string $qurBuildwork
     * @param string $url
     * @param string $data
	 *  Run Work Api to get work data
	 */
    public static function workDataApi($qurBuildwork, $url, $data){

        foreach ($data as $datakey => $datavalue) {

            //Get all data from tx_orcid_workdata table
            $cond_work_data = $qurBuildwork->select('tstamp')->from('tx_orcid_workdata')->where($qurBuildwork->expr()->eq('orcid_workput_code', $qurBuildwork->createNamedParameter($datavalue['id'])))->execute();
            $cond_work_data = $cond_work_data->fetchAll();
            $time_dif =  intval(time()) - intval($cond_work_data[0]['tstamp']);

            if ($time_dif > 3600 || empty($cond_work_data)) {
                $curl = curl_init();
                $headers = array(
                    'Accept: application/vnd.citationstyles.csl+json'
                );

                curl_setopt($curl, CURLOPT_URL, $url.$datavalue['path']);
                curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
                curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

                $result = curl_exec($curl);
                if(!$result){
                    echo ' ';
                    // die("Connection Failure");
                }else{
                    $workid = $datavalue['id'];
                    $workyear = $datavalue['year'];
                    $orcid_id = explode("/",strval($datavalue['path']));
                    $orcid_id = $orcid_id[1];

                    //condition if work is already exist in tx_orcid_workdata table
                    self::workDataQuery($workid, $result, $orcid_id, $workyear);

                }
                curl_close($curl);



            }

        }

    }

	/**
     * @param string $workid
     * @param string $work_content
     * @param string $orcid_id
     * @param string $workyear
	 * Insert and update work data in tx_orcid_workdata table in Mysql
	 */
    public static function workDataQuery($workid, $work_content, $orcid_id, $workyear){
        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');
        $oid = $queryBuilder->select('uid','orcid_workput_code')->from('tx_orcid_workdata')->where($queryBuilder->expr()->eq('orcid_workput_code', $queryBuilder->createNamedParameter($workid)))->execute();
        $row = $oid->fetch();
        if(empty($row)){
            $queryBuilder->insert('tx_orcid_workdata')->values(['orcid_workput_code' => $workid, 'orcid_id' => $orcid_id, 'orcid_work_date' => $workyear, 'orcid_work_data' => $work_content, 'crdate'=>time()])->execute();
            print_r($workid);
            echo '<br>';
        }else{
            //update according to orcid_workput_code
            $queryBuilder
                ->update('tx_orcid_workdata')
                ->where(
                    $queryBuilder->expr()->eq('orcid_workput_code', $queryBuilder->createNamedParameter($workid))
                )
                ->set('orcid_id', $orcid_id)
                ->set('orcid_work_data', $work_content)
                ->set('tstamp', time())
                ->execute();
        }

    }


    /*
     * @param string $result
	 */
    //Function for the convert xml to json format according to the CSL PHP library
    protected function convertJSon($result){

        //Convert XML to Array
        $xml = preg_replace("/(<\/?)(\w+):([^>]*>)/", "$1$2_$3", $result);
        $ob = simplexml_load_string($xml);

        $objdata = $ob->{'activities_activities-summary'}->{'activities_works'};
        $result_array=array();
        foreach($objdata as $objdata_key => $objdata_key_val){
            foreach ($objdata_key_val as $act_grp => $act_grp_val) {
                if($act_grp == 'activities_group'){
                    foreach ($act_grp_val as $worksum => $worksum_val) {
                        if($worksum == 'work_work-summary'){
                            $work = array();
                            $work['id']              = strval($worksum_val['put-code']);
                            $work['path']            = strval($worksum_val['path']);
                            $work['year']            = strval($worksum_val->{'common_publication-date'}->common_year);
                            array_push($result_array,$work)	;

                        }

                    }

                }
            }
        }
        return $result_array;
    }

}
