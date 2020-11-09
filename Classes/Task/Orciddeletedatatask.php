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
use TYPO3\CMS\Core\Database\Query\Restriction\DeletedRestriction;
use TYPO3\CMS\Core\Database\Query\Restriction\HiddenRestriction;

class Orciddeletedatatask extends \TYPO3\CMS\Scheduler\Task\AbstractTask {
	

	public function execute() {
		
		//Initialize query to get Orcid id data from tt_content table
        $queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tt_content');
		$queryBuilder->getRestrictions()->removeByType(HiddenRestriction::class)->removeByType(DeletedRestriction::class);
		
		//Initialize query to get Orcid id data from tx_orcid table
        $queryBuilderOrcid = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid');
		
		//Initialize query to get Orcid id data from tx_orcid_workdata table
        $queryBuilderOrcidWrok = GeneralUtility::makeInstance(ConnectionPool::class)->getQueryBuilderForTable('tx_orcid_workdata');

        //Get all Orcid ids from tt_content table if ids deleted
        $orcid_ids = $queryBuilder->select('contactorcid_id','deleted')->from('tt_content')->where(
		$queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(1)),
		$queryBuilder->expr()->neq('contactorcid_id', $queryBuilder->createNamedParameter(''))
		)->execute();
        $orcid_ids = $orcid_ids->fetchAll();
		
		//Get all Orcid ids from tt_content table if ids not deleted
		$orcidnd_ids = $queryBuilder->select('contactorcid_id')->from('tt_content')->where(
		$queryBuilder->expr()->eq('deleted', $queryBuilder->createNamedParameter(0)),
		$queryBuilder->expr()->neq('contactorcid_id', $queryBuilder->createNamedParameter(''))
		)->execute();
        $orcidnd_ids = $orcidnd_ids->fetchAll();
		
		foreach($orcid_ids as $orcid_id){
			
			if(array_search($orcid_id['contactorcid_id'],array_column($orcidnd_ids, 'contactorcid_id')) === false){
				//Query for delete id related data from tx_orcid table
				$queryBuilderOrcid
			   ->delete('tx_orcid')
			   ->where(
				  $queryBuilderOrcid->expr()->eq('orcid_id', $queryBuilderOrcid->createNamedParameter($orcid_id['contactorcid_id']))
			   )
			   ->execute();
			   
			   //Query for delete id related data from tx_orcid_workdata table
			   $queryBuilderOrcidWrok
			   ->delete('tx_orcid_workdata')
			   ->where(
				  $queryBuilderOrcidWrok->expr()->eq('orcid_id', $queryBuilderOrcidWrok->createNamedParameter($orcid_id['contactorcid_id']))
			   )
			   ->execute();
			}
		}
		
        return true;
    }
    

}
