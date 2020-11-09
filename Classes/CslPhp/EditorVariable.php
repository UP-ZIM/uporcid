<?php
namespace UniPotsdam\Orcid\CslPhp;

use UniPotsdam\Orcid\Seboettg\CiteProc\Util\Variables;

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

class EditorVariable extends Variables
{
    const CREATORS = [
        'author',               //author
        'collection-editor',    //editor of the collection holding the item (e.g. the series editor for a book)
        'composer',             //composer (e.g. of a musical score)
        'container-author',     //author of the container holding the item (e.g. the book author for a book chapter)
        'director',             //director (e.g. of a film)
        'editor',               //editor
        'editorial-director',   //managing editor (“Directeur de la Publication” in French)
        'illustrator',          //illustrator (e.g. of a children’s book)
        'interviewer',          //interviewer (e.g. of an interview)
        'original-author',      //
        'recipient',            //recipient (e.g. of a letter)
        'reviewed-author'       //author of the item reviewed by the current item
    ];

    /**
     * @param $name
     * @return bool
     */
    public static function isEditorVariable($name)
    {
        return in_array($name, self::CREATORS);
    }

    /**
     * @param \stdClass $data
     * @param string $variable
     * @return string
     * @throws \Seboettg\CiteProc\Exception\InvalidStylesheetException
     * @throws \Seboettg\CiteProc\Exception\CiteProcException
     */
    public static function editorHash(\stdClass $data, $variable)
    {
        if (!self::isEditorVariable($variable)) {
            throw new \InvalidArgumentException("\"$variable\" is not a valid name variable.");
        }

        $names = new Names(new \SimpleXMLElement("<names variable=\"$variable\" delimiter=\"-\"><name form=\"long\" sort-separator=\",\" name-as-sort-order=\"all\"/></names>"), null);
        return $names->render($data);
    }

}