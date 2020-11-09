<?php
namespace UniPotsdam\Orcid\Evaluation;

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

use TYPO3\CMS\Core\Messaging\FlashMessage;
use TYPO3\CMS\Core\Messaging\FlashMessageService;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Extbase\Object\ObjectManager;


 class OrcidEvaluation{

    /**
     * JavaScript code for client side validation/evaluation
     *
     * @return string JavaScript code for client side validation/evaluation
     */
    

    public function evaluateFieldValue($value, $is_in, &$set)
    {
        
        //Initialize query to get Orcid data from tx_orcid table
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');

        //Initialize query to get Orcid data from tx_orcid table
        $qurBuildwork = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');


        //Get all data from tx_orcid_workdata table
        $cond_orcid_data = $queryBuilder->select('orcid_id')->from('tx_orcid')->execute();
        $cond_orcid_data = $cond_orcid_data->fetchAll();
          
        if (array_search($value  , array_column($cond_orcid_data, 'orcid_id')) != true){
			
            $apiurl = unserialize($GLOBALS['TYPO3_CONF_VARS']['EXT']['extConf']['orcid']);
            $ch = curl_init();

            curl_setopt($ch, CURLOPT_URL, $apiurl['inputApiurl'].'/'.$value);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $rst = curl_exec($ch);
            $urlRes = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if($urlRes != 200){
                if($value != null){
                    $this->flashMessage('Invalid field value', 'Please enter orcid id in correct format: 0000-0000-0000-0000', FlashMessage::ERROR);
                    $set = false; //do not save value
                }
            }else{
                $this->msQuery($value, $rst);
                
                //Convert XML to JSON function
                $quer = $this->convertJSon($rst);
                
                //Work Curl API Function
                $this->workDataApi($qurBuildwork, $apiurl['inputApiurl'], $quer);
                if($value != null){
                    $this->succFlashMessage('Input value is correct', 'Your Orcid id is: '.$value, FlashMessage::OK);
                }
                
            }
        }else{
            if($value != null){
                $this->succFlashMessage('Input value is correct', 'Your Orcid id is: '.$value, FlashMessage::OK);
            }
            
        }
        
        
        return $value;        
    }

    /**
     * Server-side validation/evaluation on opening the record
     *
     * @param array $parameters Array with key 'value' containing the field value from the database
     * @return string Evaluated field value
     */
    public function deevaluateFieldValue(array $parameters) 
    {
        return $parameters['value'];
    }

    /**
     * @param string $messageTitle
     * @param string $messageText
     * @param int $severity
     */
    protected function flashMessage($messageTitle, $messageText, $severity = FlashMessage::ERROR)
    {
        $message = GeneralUtility::makeInstance(
            FlashMessage::class,
            $messageText,
            $messageTitle,
            $severity,
            true
        );

        $objectManager = GeneralUtility::makeInstance(ObjectManager::class);
        $flashMessageService = $objectManager->get(FlashMessageService::class);
        $messageQueue = $flashMessageService->getMessageQueueByIdentifier();
        $messageQueue->addMessage($message);
    }

    /**
     * @param string $messageTitle
     * @param string $messageText
     * @param int $severity
     */
    protected function succFlashMessage($messageTitle, $messageText, $severity = FlashMessage::OK)
    {
        $message = GeneralUtility::makeInstance(
            FlashMessage::class,
            $messageText,
            $messageTitle,
            $severity,
            true
        );

        $objectManager = GeneralUtility::makeInstance(ObjectManager::class);
        $flashMessageService = $objectManager->get(FlashMessageService::class);
        $messageQueue = $flashMessageService->getMessageQueueByIdentifier();
        $messageQueue->addMessage($message);
    }

    // Insert and update Query for orcid data
	 /**
     * @param string $resid
     * @param string $content
     */
    protected function msQuery($resid, $content){
        //Get all Orcid ID table data
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');
        $oid = $queryBuilder->select('uid', 'orcid_id')->from('tx_orcid')->where($queryBuilder->expr()->eq('orcid_id', $queryBuilder->createNamedParameter($resid)))->execute();
        $row = $oid->fetch();
        $uid = $row['uid'];
        if($row['orcid_id'] == $resid){

            //update according to orcid ID
            GeneralUtility::makeInstance(ConnectionPool::class)
            ->getConnectionForTable('tx_orcid')
            ->update(
                'tx_orcid',
                ['orcid_data' => $content],
                ['tstamp' => time()],
                ['uid' => $uid]
            );
        } else{
            //Insert Orcid Id in tx_orcid table
            $queryBuilder->insert('tx_orcid')->values(['orcid_id' => $resid,'orcid_data' => $content, 'crdate'=>time()])->execute();
        }
    }

	/**
     * @param string $qurBuildwork
     * @param string $url
     * @param string $data
	 *  Run Work Api to get work data
	 */
    protected function workDataApi($qurBuildwork, $url, $data){

        //Get all data from tx_orcid_workdata table
        $cond_work_data = $qurBuildwork->select('orcid_workput_code')->from('tx_orcid_workdata')->execute();
        $cond_work_data = $cond_work_data->fetchAll();
		
            foreach ($data as $workkey => $workvalue) {
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
                    if(!$result){
                        echo $url.$workvalue['path'];
                        echo '<BR><BR>';
                        // die("Connection Failure");
                    }else{
                        $workid = $workvalue['id'];
                        $workyear = $workvalue['year'];
                        $orcid_id = explode("/",strval($workvalue['path']));
                        $orcid_id = $orcid_id[1];
                        
                        //condition if work is already exist in tx_orcid_workdata table 
                        $this->workDataQuery($workid, $result, $orcid_id, $workyear);
                        
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
    protected function workDataQuery($workid, $work_content, $orcid_id, $workyear){
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
                ['tstamp' => time()],
                ['uid' => $uid]
            );
        } else{
            //Insert Orcid Id in tx_orcid table
            $queryBuilder->insert('tx_orcid_workdata')->values(['orcid_workput_code' => $workid, 'orcid_id' => $orcid_id, 'orcid_work_date' => $workyear, 'orcid_work_data' => $work_content, 'crdate'=>time()])->execute();
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
        $prtitle = '';
        foreach($objdata as $objdata_key => $objdata_key_val){ 
            foreach ($objdata_key_val as $act_grp => $act_grp_val) {    
                if($act_grp == 'activities_group'){
                    foreach ($act_grp_val as $worksum => $worksum_val) {
                        if($worksum == 'work_work-summary' && strval($prtitle) !== strval($worksum_val->work_title->common_title)){
                            $work = array();
                            $work['id']              = strval($worksum_val['put-code']);
                            $work['path']            = strval($worksum_val['path']);
                            $work['year']            = strval($worksum_val->{'common_publication-date'}->common_year);
                            $work['title']            = strval($worksum_val->work_title->common_title);
                            array_push($result_array,$work)	;   
                        }
                        $prtitle = $worksum_val->work_title->common_title;
                    }
                    
                }    
            }
        }

        return $result_array;
    }


 }