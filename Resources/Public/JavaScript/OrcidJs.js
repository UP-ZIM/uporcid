
define(['jquery'], function($) {

    $(document).ready(function() {
		// console.log('orcid plugin js is working');

		$('button.btn-sm').click(function() {
            var name;
		    name = $('.typo3-TCEforms .tab-content').find('select').val();
            // var n = name.includes("[CType]");
            if (name == 'uporcidext'){
                alert('Processing an Orcid Data, please don\'t Refresh this page');
                $( ".t3js-module-body" ).prepend( "<div id=\"orcidbar\"></div>" );
            }

		});

    });
});