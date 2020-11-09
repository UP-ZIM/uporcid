<?php

/**
     * --------------------------------------------------------------
	 * This file is part of the package UniPotsdam\Orcid.
     * copyright 2019 by University Potsdam
     * https://www.uni-potsdam.de/
     *
     * Project: Orcid Extension
	 * User: Anuj Sharma (asharma@uni-potsdam.de)
     *
     * --------------------------------------------------------------
     */

defined('TYPO3_MODE') || die();

call_user_func(function()
{
    /**
     * Temporary variables
     */
    $extensionKey = 'orcid';

    /**
     * Default PageTS for OrcidData
     */
    \TYPO3\CMS\Core\Utility\ExtensionManagementUtility::registerPageTSConfigFile(
        $extensionKey,
        'Configuration/TsConfig/Page/All.tsconfig',
        'Orcid Data'
    );
	
	//Add plugin icons and text in Typical Page Content Opiton
	\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPlugin(
        array(
            'Orcid Data',
            'uporcidext',
            'EXT:' . $extensionKey . '/Resources/Public/Icons/orcid.png'
        ),
        'CType',
        $extensionKey
    );
});
