<?php
namespace UniPotsdam\Orcid\CslPhp;

use UniPotsdam\Orcid\Seboettg\CiteProc\Exception\InvalidStylesheetException;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\AffixesTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\ConsecutivePunctuationCharacterTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\DelimiterTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\DisplayTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\FormattingTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\Factory;
use UniPotsdam\Orcid\Seboettg\Collection\ArrayList;
use UniPotsdam\Orcid\Seboettg\CiteProc\Rendering\Group;

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

class EditorGroup extends Group{

    public function demo(){
        echo 'inherite demo function';
    }
}