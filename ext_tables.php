<?php
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
	 
defined('TYPO3_MODE') || die();

\TYPO3\CMS\Extbase\Utility\ExtensionUtility::registerPlugin(
    $_EXTKEY,
    'uporcidext',
    'Orcid Data'
);

/**
     * Default TypoScript for OrcidData
     */
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addStaticFile(
        $_EXTKEY,
        'Configuration/TypoScript',
        'Orcid Data'
    );
    
$TCA['tx_orcid_page']['ctrl']['type'] = 'orcid_id_data';
$tmp_fe_users_columns = array(
                'orcid_id_data' => array(
                            'exclude' => 0,
                            'label' =>'ID',
                                'config' => array(
                                                'type' => 'input',
                                                'size' => 100,
                                                'eval' => 'alphanum_x',
                                )
                )
);


\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTCAcolumns('tx_orcid_page', $tmp_fe_users_columns, 1);
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addToAllTCAtypes('tx_orcid_page', 'orcid_id_data');

//Allow tx_orcid field in tt_content table with standard pages
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::allowTableOnStandardPages('tx_orcid_page');

 