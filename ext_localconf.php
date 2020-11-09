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


$iconRegistry = \TYPO3\CMS\Core\Utility\GeneralUtility::makeInstance(\TYPO3\CMS\Core\Imaging\IconRegistry::class);

// use same identifier as used in TSconfig for icon
$iconRegistry->registerIcon(
   // use same identifier as used in TSconfig for icon
   'orcid-ext',
   \TYPO3\CMS\Core\Imaging\IconProvider\BitmapIconProvider::class,
   // font-awesome identifier ('external-link-square')
   ['source' => 'EXT:'.$_EXTKEY .'/Resources/Public/Icons/orcid.png']
);



if ($_EXTKEY=="orcid" && TYPO3_MODE === 'BE' )   {
  $pageRenderer = \TYPO3\CMS\Core\Utility\GeneralUtility::makeInstance(\TYPO3\CMS\Core\Page\PageRenderer::class);
  $pageRenderer->loadRequireJsModule('TYPO3/CMS/Orcid/OrcidJs');
}


/***************
 * Register "orcdidata" as global fluid namespace
 */
$GLOBALS['TYPO3_CONF_VARS']['SYS']['fluid']['namespaces']['orcdidata'][] = 'UniPotsdam\\Orcid\\ViewHelpers';

// Register the class to be available in 'eval' of TCA
$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['tce']['formevals']['UniPotsdam\\Orcid\\Evaluation\\OrcidEvaluation'] = '';

/***************
 * Register Scheduler task for Orcid Data
 */
 

$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['scheduler']['tasks'][UniPotsdam\Orcid\Task\Orcidtask::class] = array(
   'extension' => $_EXTKEY,
   'title' => 'Orcid Data',
   'description' => 'Get orcid data',
);
$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['scheduler']['tasks'][UniPotsdam\Orcid\Task\Orciddeletedatatask::class] = array(
   'extension' => $_EXTKEY,
   'title' => "Delete Orcid id's Data",
   'description' => 'Delete Orcid data from database, If orcid id is not used anymore.',
);
// Register for hook to show preview of tt_content element of CType="uporcidext" in page module
$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['cms/layout/class.tx_cms_layout.php']['tt_content_drawItem']['uporcidext'] = UniPotsdam\Orcid\Hooks\PageLayoutView\NewContentElement::class;


/***************
 * PageTS
 */
\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addPageTSConfig('<INCLUDE_TYPOSCRIPT: source="FILE:EXT:' . $_EXTKEY . '/Configuration/TsConfig/Page/All.tsconfig">');
