<?php

/*
 * This file is part of the package UniPotsdam\Orcid.
 *
 * For the full copyright and license information, please read the
 * LICENSE file that was distributed with this source code.
 */

namespace UniPotsdam\Orcid\Tests\Unit\Utility;

use UniPotsdam\Orcid\ViewHelpers\OrcidDataViewHelper;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;


/**
 * Testcase for class UniPotsdam\Orcid\Tests\Unit\Utility\OrcidDataTest
 */
class OrcidDataTest extends UnitTestCase
{
    /**
     * @var ProtectedClass
     */
    private $orcidClass = null;   

    public function getResult(){
        $this->orcidClass  = new OrcidDataViewHelper();
        $this->assertSame(); 
    }
    

}