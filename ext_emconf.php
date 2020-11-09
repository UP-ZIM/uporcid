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
/**
 * Extension Manager/Repository config file for ext "orcid".
 */
$EM_CONF[$_EXTKEY] = [
    'title' => 'Orcid',
    'description' => 'Get the all data with typo3',
    'category' => 'plugin',
    'constraints' => [
        'depends' => [
            'typo3' => '9.5.0-9.5.99',
            'fluid_styled_content' => '9.5.0-9.5.99',
            'rte_ckeditor' => '9.5.0-9.5.99'
        ],
        'conflicts' => [
        ],
    ],
    'autoload' => [
        'psr-4' => [
            'UniPotsdam\\Orcid\\' => 'Classes'
        ],
    ],
    'state' => 'beta',
    'uploadfolder' => 0,
    'createDirs' => '',
    'clearCacheOnLoad' => 1,
    'author' => 'Anuj Sharma',
    'author_email' => 'anuj1992sharma@gmail.com',
    'author_company' => 'UniPotsdam',
    'version' => '1.0.0',
];
