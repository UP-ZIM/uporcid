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

use UniPotsdam\Orcid\Seboettg\CiteProc\CiteProc;
use UniPotsdam\Orcid\Seboettg\CiteProc\Exception\CiteProcException;
use UniPotsdam\Orcid\Seboettg\CiteProc\Rendering\HasParent;
use UniPotsdam\Orcid\Seboettg\CiteProc\Rendering\Name\NamePart;
use UniPotsdam\Orcid\Seboettg\CiteProc\Rendering\Name\Names;
use UniPotsdam\Orcid\Seboettg\CiteProc\Style\InheritableNameAttributesTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Style\Options\DemoteNonDroppingParticle;
use UniPotsdam\Orcid\Seboettg\CiteProc\Style\Options\SubsequentAuthorSubstituteRule;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\AffixesTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\DelimiterTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Styles\FormattingTrait;
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\CiteProcHelper;
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\Factory;
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\NameHelper;
use UniPotsdam\Orcid\Seboettg\CiteProc\Util\StringHelper;

class Editor
{
    use InheritableNameAttributesTrait,
        FormattingTrait,
        AffixesTrait,
        DelimiterTrait;

    /**
     * @var array
     */
    protected $nameParts;

    /**
     * Specifies the text string used to separate names in a name variable. Default is ”, ” (e.g. “Doe, Smith”).
     * @var
     */
    private $delimiter = ", ";

    /**
     * @var Names
     */
    private $parent;

    /**
     * @var \SimpleXMLElement
     */
    private $node;

    /**
     * @var string
     */
    private $etAl;

    /**
     * @var string
     */
    private $variable;

    /**
     * Name constructor.
     * @param \SimpleXMLElement $node
     * @param Names $parent
     * @throws \UniPotsdam\Orcid\Seboettg\CiteProc\Exception\InvalidStylesheetException
     */
    public function __construct( $node, Names $parent)
    {
        $this->node = $node;
        $this->parent = $parent;

        $this->nameParts = [];

        /** @var \SimpleXMLElement $child */
        foreach ($node->children() as $child) {

            switch ($child->getName()) {
                case "name-part":
                    /** @var NamePart $namePart */
                    $namePart = Factory::create($child, $this);
                    $this->nameParts[$namePart->getName()] = $namePart;
            }
        }

        foreach ($node->attributes() as $attribute) {
            switch ($attribute->getName()) {
                case 'form':
                    $this->form = (string)$attribute;
                    break;
            }

        }

        $this->initFormattingAttributes($node);
        $this->initAffixesAttributes($node);
        $this->initDelimiterAttributes($node);
    }

}