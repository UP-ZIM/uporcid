<?php
defined('TYPO3_MODE') || die();
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

call_user_func(function()
{
    /**
     * Temporary variables
     */
    $extensionKey = 'orcid';

        // Created input fields for orcid plugin
	$temporaryColumns = array (
                'contactorcid_id' => array (
                        'exclude' => 1,
                        'label' => 'LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:orcidtext.id',
                        'config' => [
                                'type' => 'input',
                                'placeholder' => '0000-0000-0000-0000',
                                'size' => '30',
                                'eval' => 'UniPotsdam\\Orcid\\Evaluation\\OrcidEvaluation,required',
                        ],
                ),
                'contactoricidbox_style' => array (
                        'exclude' => 1,
                        'label' => 'LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle.label',
                        'config' => array (
                                'type' => 'select',
                                'renderType' => 'selectSingle',
                                'items' => array (
                                        array('Common Citation Style', '--div--'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle1', 'acm-sig-proceedings'),
                                        //array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle2', 'acs-nano'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle3', 'apa'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle4', 'associacao-brasileira-de-normas-tecnicas'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle5', 'chicago-author-date'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle6', 'harvard-cite-them-right'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle7', 'ieee'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle8', 'modern-language-association'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle9', 'turabian-fullnote-bibliography'),
                                        array('LLL:EXT:'.$extensionKey.'/Resources/Private/Language/locallang_be.xlf:select.contactstyle10', 'vancouver'),
                                ),
                                'size' =>1,
                                'maxitems' => 1,
                        )
                ),
                'contactorcid_front_style' => array (
                        'exclude' => 1,
                        'config' => [
                                'type' => 'check',
                                'items' => [
                                        // label, value
                                        ['Group style according to years', 'yearstyle'],
                                ],
                        ],
                ),
        );

        //Added tx_orcid table and controller 
        $GLOBALS['TCA']['tx_orcid_page'] = [
                'ctrl' => [
                        'label' => 'orcid_id',
                        'tstamp' => 'tstamp',
                        'crdate' => 'crdate',
                        'cruser_id' => 'cruser_id',
                        'dividers2tabs' => true,
                        'versioningWS' => true,
                        'sortby' => 'sorting',
                        'default_sortby' => 'ORDER BY sorting',
                        'delete' => 'deleted',
                        'iconfile' => 'EXT:' . $extensionKey . '/Resources/Public/Icons/orcid.png'
                    ],
                    'interface' => [
                        'showRecordFieldList' => 'hidden, orcid_id',
                    ],
                    'types' => [
                        '0' => [
                            'showitem' => 'pages, orcid_id'
                        ],
                    ],
                    'columns' => [
                        'orcid_id' => [
                            'exclude' => 0,
                            'label' =>'ID',
                            'config' => [
                                'type' => 'input',
                                'size' => 30,
                                'eval' => 'trim,required,alphanum_x'
                            ],
                        ],
                    ],
            ];

        
        //add Orcid fields in tt_content table 
	\TYPO3\CMS\Core\Utility\ExtensionManagementUtility::addTCAcolumns(
        'tt_content',
        $temporaryColumns
        );
        
	//Setup Backend content element layout with custom field
	$GLOBALS['TCA']['tt_content']['types']['uporcidext'] = [
		'showitem' => '--palette--;LLL:EXT:frontend/Resources/Private/Language/locallang_ttc.xlf:palette.general;general,header,'.
					  'contactorcid_id;;;,'.
					  'contactoricidbox_style;;;1-1-1,'.
					  'contactorcid_front_style;;;1-1-1,'.
                                          '--div--;LLL:EXT:frontend/Resources/Private/Language/locallang_ttc.xlf:tabs.appearance,
                                          --palette--;;appearanceLinks,' .
                                      '--div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:language,
                                          --palette--;;language,'.
                                      '--div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:access,' .
                                      '--palette--;;hidden,' .
                                      '--palette--;;access,'.
                                      '--div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:extended,'
        ];
        
        

});
