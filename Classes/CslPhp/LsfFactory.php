<?php

namespace UniPotsdam\Orcid\CslPhp;

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
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\Factory;
use UniPotsdam\Orcid\Seboettg\CiteProc\Exception\InvalidStylesheetException;


/**
 * Class Factory
 * @package Seboettg\CiteProc\Util
 *
 * @author Sebastian Böttger <seboettg@gmail.com>
 */
class LsfFactory extends Factory
{
    const CITE_PROC_NODE_NAMESPACE = "UniPotsdam\\Orcid";

    /**
     * @var array
     */
    static $nodes = [

        'layout'        => "\\Seboettg\\CiteProc\\Rendering\\Layout",
        'text'          => "\\Seboettg\\CiteProc\\Rendering\\Text",
        "macro"         => "\\Seboettg\\CiteProc\\Rendering\\Macro",
        "number"        => "\\Seboettg\\CiteProc\\Rendering\\Number",
        "label"         => "\\Seboettg\\CiteProc\\Rendering\\Label",
        "group"         => "\\Seboettg\\CiteProc\\Rendering\\Group",
        "choose"        => "\\Seboettg\\CiteProc\\Rendering\\Choose\\Choose",
        "if"            => "\\Seboettg\\CiteProc\\Rendering\\Choose\\ChooseIf",
        "else-if"       => "\\Seboettg\\CiteProc\\Rendering\\Choose\\ChooseElseIf",
        "else"          => "\\Seboettg\\CiteProc\\Rendering\\Choose\\ChooseElse",
        'date'          => "\\Seboettg\\CiteProc\\Rendering\\Date\\Date",
        "date-part"     => "\\Seboettg\\CiteProc\\Rendering\\Date\\DatePart",
        "names"         => "\\Seboettg\\CiteProc\\Rendering\\Name\\Names",
        "name"          => "\\Seboettg\\CiteProc\\Rendering\\Name\\Name",
        "editor"          => "\\CslPhp\\Editor",
        "name-part"     => "\\Seboettg\\CiteProc\\Rendering\\Name\\NamePart",
        "substitute"    => "\\Seboettg\\CiteProc\\Rendering\\Name\\Substitute",
        "et-al"         => "\\Seboettg\\CiteProc\\Rendering\\Name\\EtAl"
    ];

    /**
     * @param \SimpleXMLElement $node
     * @param mixed $param
     * @return mixed
     * @throws InvalidStylesheetException
     */
    public static function create($node, $param = null)
    {
        $nodeClass = self::CITE_PROC_NODE_NAMESPACE . self::$nodes[$node->getName()];
        if (!class_exists($nodeClass)) {
            throw new InvalidStylesheetException("For node {$node->getName()} does not exist any counterpart class \"" . $nodeClass . "\". The given stylesheet seems to be invalid.");
        }
        if ($param != null) {
            return new $nodeClass($node, $param);
        }
        return new $nodeClass($node);
    }
}
