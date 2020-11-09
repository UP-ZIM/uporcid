//Overview: 	simple library that transforms an ORCID record into a list of citations or citeproc objects
//				attempts to fetch authoritative metadata from DOI, otherwise uses ORCID metadata
//
//Licence: MIT
//Author: @tomdemeranville
//Usage:
//	orcid.init(callback);
//	function callback(){
//		//to fetch asyncronously and have the callback called once for each citation (recommended) use:
//		orcid.resolveCitations("0000-0000-0000-0000", onCompleteCallback, true);
//		//to get the citations an array of citation strings via a callback as a batch use:
//		orcid.resolveCitations("0000-0000-0000-0000", onCompleteCallback, false);
//		// the default style is Chicago, we can ask for bibtex instead like this:
//		orcid.resolveCitations("0000-0000-0000-0000", onCompleteCallback, false, orcid.styleBibtex);
//		// if you want an array of citeproc JSON objects instead, use this:
//		orcid.resolveCitations("0000-0000-0000-0000", onCompleteCallback, true, "", true);	
//	}
//
//	//If all you need is a list of titles, identifiers and URLS, use simpleWorks
//	//This also demonstrates how to access the API via swagger (full v2.0 api is supported)
//	var client = orcid.init(callback);
//	function callback(){
//		client.apis["Public API v2.0"].viewActivities({orcid:orcidID}, function(data) {
//			var simpleWorks = orcid.activitiesToSimpleWorks(data);
//			//do whatever with the simpleWorks
//		});
//	}
//
// Dependencies: swagger-client.js, jquery, citeproc-js [transitive xmle4x.js,xmldom.js] 

var orcid = function(){

	var pubSwagger = "https://pub.orcid.org/resources/swagger.json";
	//var pubSwagger = "https://localhost:8443/orcid-pub-web/resources/swagger.json";
	//var pubAPI = "https://localhost:8443/orcid-pub-web/v2.0";
	var pubAPI = "https://pub.orcid.org/v2.0";
	var client = null;

	//initialises the swagger client.
	function createPublicV2ORCIDClient(onSuccess){
		if (client == null){
			client = new SwaggerClient({
				url: pubSwagger,
		    	success: onSuccess
		    });
		}
		return client;
	}

	//transform ORCID activities into (title,ID,identifierType,originalOrder,URL,citeprocURL)
	function activitiesToSimpleWorks(activitiesObject){
		var order = 0;
		var worksList = activitiesObject.obj.works.group.map(function(obj){ 
		   var rObj = {originalOrder:""+order};
		   order++;
		   rObj.title = obj["work-summary"][0].title.title.value;
		   if (obj["external-ids"] && obj["external-ids"]["external-id"] && obj["external-ids"]["external-id"][0]){
			   rObj.ID = obj["external-ids"]["external-id"][0]["external-id-value"];
			   rObj.identifierType = obj["external-ids"]["external-id"][0]["external-id-type"];
		   }
		   var prefix = "";
		    if (rObj.identifierType == "doi" && rObj.ID && rObj.ID.match('^https?://')){
		    	//due to bug in browser 303 redirect implemetations forgetting Accept headers,
		    	//we resolve directly at crossref and retry at datacite if we get a 404
		    	rObj.ID = rObj.ID.replace(/^https?:\/\/(dx\.)?doi\.org\//i, ''); //remove url
		    	prefix = "http://data.crossref.org/";
		    } else if (rObj.identifierType == "doi" && rObj.ID){
				prefix = "http://data.crossref.org/";
			} else if (rObj.identifierType == "isbn"){
				prefix = "http://www.worldcat.org/isbn/";
			} else if (rObj.identifierType == "arxiv"){
				prefix = "http://arxiv.org/abs/";
			} else if (rObj.identifierType == "asin"){
				prefix = "http://www.amazon.com/dp/";
			} else if (rObj.identifierType == "ethos"){
				prefix = "http://ethos.bl.uk/OrderDetails.do?uin=";
			} else if (rObj.identifierType == "jstor"){
				prefix = "http://www.jstor.org/stable/";
			} else if (rObj.identifierType == "lccn"){
				prefix = "http://lccn.loc.gov/";
			} else if (rObj.identifierType == "mr"){
				prefix = "http://www.ams.org/mathscinet-getitem?mr=";
			} else if (rObj.identifierType == "oclc"){
				prefix = "http://www.worldcat.org/oclc/";
			} else if (rObj.identifierType == "ol"){
				prefix = "http://openlibrary.org/b/";
			} else if (rObj.identifierType == "ol"){
				prefix = "http://www.osti.gov/energycitations/product.biblio.jsp?osti_id=";
			} else if (rObj.identifierType == "pmc"){
				prefix = "http://www.ncbi.nlm.nih.gov/pubmed/";
			} else if (rObj.identifierType == "pmid"){
				prefix = "http://europepmc.org/abstract/med/";
			} else if (rObj.identifierType == "ssrn"){
				prefix = "http://papers.ssrn.com/abstract_id=";
			}
			if ( prefix != "" || rObj.identifierType == "handle" || rObj.identifierType == "uri" || rObj.identifierType == "doi"){
				rObj.URL = prefix + rObj.ID;
			}
			if (rObj.identifierType == "doi"){
				rObj.citeprocURL = rObj.URL;				
			}else{
				rObj.citeprocURL = pubAPI+obj["work-summary"][0].path;				
			}
		   return rObj;
		});
		return worksList;
	}

	//simple <li> generator for reference lists
	function appendSimpleWorksToElement(simpleWorks, elementID){
		simpleWorks.forEach(function(obj){			
			if ( obj.URL ){
				document.getElementById(elementID).innerHTML += "<li><a href='" + obj.URL + "'>"+ obj.title + " - (" + obj.identifierType +":"+ obj.ID +")</a></li>";	
			} else {
				document.getElementById(elementID).innerHTML += "<li>"+ obj.title + " - (" + obj.identifierType +":"+ obj.ID +")</li>";	
			}
		});
	}

	// add some extra juice to jquery - one callback for multiple parallel ajax requests
	// see http://stackoverflow.com/questions/5627284/calling-multiple-ajax-requests-in-parallel-and-handling-responses-by-passing-an
	if (jQuery.when.all===undefined) {
	    jQuery.when.all = function(deferreds) {
	        var deferred = new jQuery.Deferred();
	        $.when.apply(jQuery, deferreds).then(
	            function() {
	                deferred.resolve(Array.prototype.slice.call(arguments));
	            },
	            function() {
	                deferred.fail(Array.prototype.slice.call(arguments));
	            });

	        return deferred;
	    }
	}

	//attempts to resolve citeproc metadata for all works
	//onDone is passed an array of Jquery ajax results (both successes and failiure)
	function fetchCiteprocJSONForSimpleWorks(simpleWorks, onDone, demoData){
		var requests = [];
		simpleWorks.forEach(function(obj){
			var d = fetchCiteprocJSONForSimpleWork(obj);
			requests.push(d);
		});
		$.when.all(requests).done(onDone);
	}

	//attempts to resolve citeproc metadata for works and resolves the citation asynchronously
	//onEachWork is passed each Jquery ajax result as it arrives (both successes and failiure)
	function fetchCiteprocJSONForSimpleWorksOneByOne(simpleWorks, onEachWork, demoData){
		simpleWorks.forEach(function(obj){
			var d = fetchCiteprocJSONForSimpleWork(obj);
			var requests = [];		
			requests.push(d);	
			$.when.all(requests).done(onEachWork);
		});
	}

	//returns a Deffered containing an ajax request.
	//retries failed crossref requests with datacite
	function fetchCiteprocJSONForSimpleWork(simpleWork){
		var d = $.Deferred();

		var r = 
			$.ajax({
				headers: { 
					Accept : "application/vnd.citationstyles.csl+json"
			    },
	            type: "GET",
	            crossDomain: true,
	            url: simpleWork.citeprocURL,
	            dataType: 'json',
	            cache: false,
				success: function (data, textStatus, jqXHR) {
                    if (data){
                        if (!jqXHR.responseJSON){//fixes weird bug when working with angular and/or some versions of JQuery
                            jqXHR.responseJSON = $.parseJSON(jqXHR.responseText);
						}
                        jqXHR.responseJSON.originalOrder = simpleWork.originalOrder;  
                    }
                },
            	error: function (jqXHR, textStatus, errorThrown ){
            		jqXHR.failedWork = simpleWork;
				}
        }).done(d.resolve)
		.fail(function(jqXHR, textStatus, errorThrown){
    		if (jqXHR.status == 404 && simpleWork.citeprocURL.match('crossref')){
    			//if we tried crossref and failed, try datacite instead
    			simpleWork.citeprocURL = simpleWork.citeprocURL.replace(/crossref/i, 'datacite'); 
    			$.ajax({
					headers: { 
						Accept : "application/vnd.citationstyles.csl+json"
				    },
		            type: "GET",
		            crossDomain: true,
		            url: simpleWork.citeprocURL,
		            dataType: 'json',
		            cache: false,
					success: function (data, textStatus, jqXHR) {
	                    if (data){
	                        if (!jqXHR.responseJSON){//fixes weird bug when working with angular and/or some versions of JQuery
	                            jqXHR.responseJSON = $.parseJSON(jqXHR.responseText);
	                        }
	                        jqXHR.responseJSON.originalOrder = simpleWork.originalOrder;  
	                        jqXHR.failedWork = null;
	                    }
	                },
	            	error: function (jqXHR, textStatus, errorThrown ){
	            		jqXHR.failedWork = simpleWork;
					}

        		}).always(d.resolve);
    		}else{
    			//propigate the error to the callback.
    			d.resolve([jqXHR, textStatus, errorThrown]);
    		}
		});
		return d;
	}

	// source: https://gist.github.com/bdarcus/864632
	// default citeproc settings
	var defaultLocale = {"en-US":"<locale xml:lang=\"en\" xmlns=\"http://purl.org/net/xbiblio/csl\">  <style-options punctuation-in-quote=\"true\"/>  <date form=\"text\">    <date-part name=\"month\" suffix=\" \"/>    <date-part name=\"day\" suffix=\", \"/>    <date-part name=\"year\"/>  </date>  <date form=\"numeric\">    <date-part name=\"year\"/>    <date-part name=\"month\" form=\"numeric\" prefix=\"-\" range-delimiter=\"/\"/>    <date-part name=\"day\" prefix=\"-\" range-delimiter=\"/\"/>  </date>  <terms>    <term name=\"document-number-label\">No.</term>    <term name=\"document-number-authority-suffix\">Doc.</term>    <term name=\"un-sales-number-label\">U.N. Sales No.</term>    <term name=\"collection-number-label\">No.</term>    <term name=\"open-quote\">\u201c</term>    <term name=\"close-quote\">\u201d</term>    <term name=\"open-inner-quote\">\u2018</term>    <term name=\"close-inner-quote\">\u2019</term>    <term name=\"ordinal-01\">st</term>    <term name=\"ordinal-02\">nd</term>    <term name=\"ordinal-03\">rd</term>    <term name=\"ordinal-04\">th</term>    <term name=\"long-ordinal-01\">first</term>    <term name=\"long-ordinal-02\">second</term>    <term name=\"long-ordinal-03\">third</term>    <term name=\"long-ordinal-04\">fourth</term>    <term name=\"long-ordinal-05\">fifth</term>    <term name=\"long-ordinal-06\">sixth</term>    <term name=\"long-ordinal-07\">seventh</term>    <term name=\"long-ordinal-08\">eighth</term>    <term name=\"long-ordinal-09\">ninth</term>    <term name=\"long-ordinal-10\">tenth</term>    <term name=\"at\">at</term>    <term name=\"in\">in</term>    <term name=\"ibid\">ibid</term>    <term name=\"accessed\">accessed</term>    <term name=\"retrieved\">retrieved</term>    <term name=\"from\">from</term>    <term name=\"forthcoming\">forthcoming</term>    <term name=\"references\">      <single>reference</single>      <multiple>references</multiple>    </term>    <term name=\"references\" form=\"short\">      <single>ref</single>      <multiple>refs</multiple>    </term>    <term name=\"no date\">n.d.</term>    <term name=\"and\">and</term>    <term name=\"et-al\">et al.</term>    <term name=\"interview\">interview</term>    <term name=\"letter\">letter</term>    <term name=\"anonymous\">anonymous</term>    <term name=\"anonymous\" form=\"short\">anon.</term>    <term name=\"and others\">and others</term>    <term name=\"in press\">in press</term>    <term name=\"online\">online</term>    <term name=\"cited\">cited</term>    <term name=\"internet\">internet</term>    <term name=\"presented at\">presented at the</term>    <term name=\"ad\">AD</term>    <term name=\"bc\">BC</term>    <term name=\"season-01\">Spring</term>    <term name=\"season-02\">Summer</term>    <term name=\"season-03\">Autumn</term>    <term name=\"season-04\">Winter</term>    <term name=\"with\">with</term>        <!-- CATEGORIES -->    <term name=\"anthropology\">anthropology</term>    <term name=\"astronomy\">astronomy</term>    <term name=\"biology\">biology</term>    <term name=\"botany\">botany</term>    <term name=\"chemistry\">chemistry</term>    <term name=\"engineering\">engineering</term>    <term name=\"generic-base\">generic base</term>    <term name=\"geography\">geography</term>    <term name=\"geology\">geology</term>    <term name=\"history\">history</term>    <term name=\"humanities\">humanities</term>    <term name=\"literature\">literature</term>    <term name=\"math\">math</term>    <term name=\"medicine\">medicine</term>    <term name=\"philosophy\">philosophy</term>    <term name=\"physics\">physics</term>    <term name=\"psychology\">psychology</term>    <term name=\"sociology\">sociology</term>    <term name=\"science\">science</term>    <term name=\"political_science\">political science</term>    <term name=\"social_science\">social science</term>    <term name=\"theology\">theology</term>    <term name=\"zoology\">zoology</term>        <!-- LONG LOCATOR FORMS -->    <term name=\"book\">      <single>book</single>      <multiple>books</multiple>    </term>    <term name=\"chapter\">      <single>chapter</single>      <multiple>chapters</multiple>    </term>    <term name=\"column\">      <single>column</single>      <multiple>columns</multiple>    </term>    <term name=\"figure\">      <single>figure</single>      <multiple>figures</multiple>    </term>    <term name=\"folio\">      <single>folio</single>      <multiple>folios</multiple>    </term>    <term name=\"issue\">      <single>number</single>      <multiple>numbers</multiple>    </term>    <term name=\"line\">      <single>line</single>      <multiple>lines</multiple>    </term>    <term name=\"note\">      <single>note</single>      <multiple>notes</multiple>    </term>    <term name=\"opus\">      <single>opus</single>      <multiple>opera</multiple>    </term>    <term name=\"page\">      <single>page</single>      <multiple>pages</multiple>    </term>    <term name=\"paragraph\">      <single>paragraph</single>      <multiple>paragraph</multiple>    </term>    <term name=\"part\">      <single>part</single>      <multiple>parts</multiple>    </term>    <term name=\"section\">      <single>section</single>      <multiple>sections</multiple>    </term>    <term name=\"volume\">      <single>volume</single>      <multiple>volumes</multiple>    </term>    <term name=\"edition\">      <single>edition</single>      <multiple>editions</multiple>    </term>    <term name=\"verse\">      <single>verse</single>      <multiple>verses</multiple>    </term>    <term name=\"sub verbo\">      <single>sub verbo</single>      <multiple>s.vv</multiple>    </term>        <!-- SHORT LOCATOR FORMS -->    <term name=\"book\" form=\"short\">bk.</term>    <term name=\"chapter\" form=\"short\">chap.</term>    <term name=\"column\" form=\"short\">col.</term>    <term name=\"figure\" form=\"short\">fig.</term>    <term name=\"folio\" form=\"short\">f.</term>    <term name=\"issue\" form=\"short\">no.</term>    <term name=\"opus\" form=\"short\">op.</term>    <term name=\"page\" form=\"short\">      <single>p.</single>      <multiple>pp.</multiple>    </term>    <term name=\"paragraph\" form=\"short\">para.</term>    <term name=\"part\" form=\"short\">pt.</term>    <term name=\"section\" form=\"short\">sec.</term>    <term name=\"sub verbo\" form=\"short\">      <single>s.v.</single>      <multiple>s.vv.</multiple>    </term>    <term name=\"verse\" form=\"short\">      <single>v.</single>      <multiple>vv.</multiple>    </term>    <term name=\"volume\" form=\"short\">    	<single>vol.</single>    	<multiple>vols.</multiple>    </term>    <term name=\"edition\">edition</term>    <term name=\"edition\" form=\"short\">ed.</term>        <!-- SYMBOL LOCATOR FORMS -->    <term name=\"paragraph\" form=\"symbol\">      <single>¶</single>      <multiple>¶¶</multiple>    </term>    <term name=\"section\" form=\"symbol\">      <single>§</single>      <multiple>§§</multiple>    </term>        <!-- LONG ROLE FORMS -->    <term name=\"author\">      <single></single>      <multiple></multiple>    </term>    <term name=\"editor\">      <single>editor</single>      <multiple>editors</multiple>    </term>    <term name=\"translator\">      <single>translator</single>      <multiple>translators</multiple>    </term>        <!-- SHORT ROLE FORMS -->    <term name=\"author\" form=\"short\">      <single></single>      <multiple></multiple>    </term>    <term name=\"editor\" form=\"short\">      <single>ed.</single>      <multiple>eds.</multiple>    </term>    <term name=\"translator\" form=\"short\">      <single>tran.</single>      <multiple>trans.</multiple>    </term>        <!-- VERB ROLE FORMS -->    <term name=\"editor\" form=\"verb\">edited by</term>    <term name=\"translator\" form=\"verb\">translated by</term>    <term name=\"recipient\" form=\"verb\">to</term>    <term name=\"interviewer\" form=\"verb\">interview by</term>        <!-- SHORT VERB ROLE FORMS -->    <term name=\"editor\" form=\"verb-short\">ed.</term>    <term name=\"translator\" form=\"verb-short\">trans.</term>        <!-- LONG MONTH FORMS -->    <term name=\"month-01\">January</term>    <term name=\"month-02\">February</term>    <term name=\"month-03\">March</term>    <term name=\"month-04\">April</term>    <term name=\"month-05\">May</term>    <term name=\"month-06\">June</term>    <term name=\"month-07\">July</term>    <term name=\"month-08\">August</term>    <term name=\"month-09\">September</term>    <term name=\"month-10\">October</term>    <term name=\"month-11\">November</term>    <term name=\"month-12\">December</term>        <!-- SHORT MONTH FORMS -->    <term name=\"month-01\" form=\"short\">Jan.</term>    <term name=\"month-02\" form=\"short\">Feb.</term>    <term name=\"month-03\" form=\"short\">Mar.</term>    <term name=\"month-04\" form=\"short\">Apr.</term>	<term name=\"month-05\" form=\"short\">May</term>    <term name=\"month-06\" form=\"short\">Jun.</term>    <term name=\"month-07\" form=\"short\">Jul.</term>    <term name=\"month-08\" form=\"short\">Aug.</term>    <term name=\"month-09\" form=\"short\">Sep.</term>    <term name=\"month-10\" form=\"short\">Oct.</term>    <term name=\"month-11\" form=\"short\">Nov.</term>    <term name=\"month-12\" form=\"short\">Dec.</term>  </terms></locale>"};
	var styleChigcagoAD = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<style xmlns=\"http:\/\/purl.org\/net\/xbiblio\/csl\" class=\"in-text\" version=\"1.0\" demote-non-dropping-particle=\"never\" page-range-format=\"chicago\">\r\n  <info>\r\n    <title>Chicago Manual of Style 16th edition (author-date)<\/title>\r\n    <id>http:\/\/www.zotero.org\/styles\/chicago-author-date<\/id>\r\n    <link href=\"http:\/\/www.zotero.org\/styles\/chicago-author-date\" rel=\"self\"\/>\r\n    <link href=\"http:\/\/www.chicagomanualofstyle.org\/tools_citationguide.html\" rel=\"documentation\"\/>\r\n    <author>\r\n      <name>Julian Onions<\/name>\r\n      <email>julian.onions@gmail.com<\/email>\r\n    <\/author>\r\n    <contributor>\r\n      <name>Sebastian Karcher<\/name>\r\n    <\/contributor>\r\n    <contributor>\r\n      <name>Richard Karnesky<\/name>\r\n      <email>karnesky+zotero@gmail.com<\/email>\r\n      <uri>http:\/\/arc.nucapt.northwestern.edu\/Richard_Karnesky<\/uri>\r\n    <\/contributor>\r\n    <contributor>\r\n      <name>Andrew Dunning<\/name>\r\n      <email>andrew.dunning@utoronto.ca<\/email>\r\n    <\/contributor>\r\n    <category citation-format=\"author-date\"\/>\r\n    <category field=\"generic-base\"\/>\r\n    <summary>The author-date variant of the Chicago style<\/summary>\r\n    <updated>2014-09-11T02:57:16+00:00<\/updated>\r\n    <rights license=\"http:\/\/creativecommons.org\/licenses\/by-sa\/3.0\/\">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License<\/rights>\r\n  <\/info>\r\n  <locale xml:lang=\"en\">\r\n    <terms>\r\n      <term name=\"editor\" form=\"verb-short\">ed.<\/term>\r\n      <term name=\"container-author\" form=\"verb\">by<\/term>\r\n      <term name=\"translator\" form=\"verb-short\">trans.<\/term>\r\n      <term name=\"editortranslator\" form=\"verb\">\r\n        <single>edited and translated by<\/single>\r\n        <multiple>edited and translated by<\/multiple>\r\n      <\/term>\r\n      <term name=\"translator\" form=\"short\">trans.<\/term>\r\n    <\/terms>\r\n  <\/locale>\r\n  <macro name=\"secondary-contributors\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference\" match=\"none\">\r\n        <names variable=\"editor translator\" delimiter=\". \">\r\n          <label form=\"verb\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n          <name and=\"text\" delimiter=\", \"\/>\r\n        <\/names>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"container-contributors\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference\" match=\"any\">\r\n        <group prefix=\", \" delimiter=\", \">\r\n          <names variable=\"container-author\" delimiter=\", \">\r\n            <label form=\"verb\" suffix=\" \"\/>\r\n            <name and=\"text\" delimiter=\", \"\/>\r\n          <\/names>\r\n          <names variable=\"editor translator\" delimiter=\", \">\r\n            <label form=\"verb\" suffix=\" \"\/>\r\n            <name and=\"text\" delimiter=\", \"\/>\r\n          <\/names>\r\n        <\/group>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"editor\">\r\n    <names variable=\"editor\">\r\n      <name name-as-sort-order=\"first\" and=\"text\" sort-separator=\", \" delimiter=\", \" delimiter-precedes-last=\"always\"\/>\r\n      <label form=\"short\" prefix=\", \"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"translator\">\r\n    <names variable=\"translator\">\r\n      <name name-as-sort-order=\"first\" and=\"text\" sort-separator=\", \" delimiter=\", \" delimiter-precedes-last=\"always\"\/>\r\n      <label form=\"short\" prefix=\", \"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"recipient\">\r\n    <choose>\r\n      <if type=\"personal_communication\">\r\n        <choose>\r\n          <if variable=\"genre\">\r\n            <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n          <\/if>\r\n          <else>\r\n            <text term=\"letter\" text-case=\"capitalize-first\"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n    <\/choose>\r\n    <names variable=\"recipient\" delimiter=\", \">\r\n      <label form=\"verb\" prefix=\" \" text-case=\"lowercase\" suffix=\" \"\/>\r\n      <name and=\"text\" delimiter=\", \"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"substitute-title\">\r\n    <choose>\r\n      <if type=\"article-journal article-magazine article-newspaper review review-book\" match=\"any\">\r\n        <text macro=\"container-title\"\/>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"contributors\">\r\n    <group delimiter=\". \">\r\n      <names variable=\"author\">\r\n        <name and=\"text\" name-as-sort-order=\"first\" sort-separator=\", \" delimiter=\", \" delimiter-precedes-last=\"always\"\/>\r\n        <label form=\"short\" prefix=\", \"\/>\r\n        <substitute>\r\n          <names variable=\"editor\"\/>\r\n          <names variable=\"translator\"\/>\r\n          <text macro=\"substitute-title\"\/>\r\n          <text macro=\"title\"\/>\r\n        <\/substitute>\r\n      <\/names>\r\n      <text macro=\"recipient\"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"contributors-short\">\r\n    <names variable=\"author\">\r\n      <name form=\"short\" and=\"text\" delimiter=\", \" initialize-with=\". \"\/>\r\n      <substitute>\r\n        <names variable=\"editor\"\/>\r\n        <names variable=\"translator\"\/>\r\n        <text macro=\"substitute-title\"\/>\r\n        <text macro=\"title\"\/>\r\n      <\/substitute>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"interviewer\">\r\n    <names variable=\"interviewer\" delimiter=\", \">\r\n      <label form=\"verb\" prefix=\" \" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n      <name and=\"text\" delimiter=\", \"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"archive\">\r\n    <group delimiter=\". \">\r\n      <text variable=\"archive_location\" text-case=\"capitalize-first\"\/>\r\n      <text variable=\"archive\"\/>\r\n      <text variable=\"archive-place\"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"access\">\r\n    <group delimiter=\". \">\r\n      <choose>\r\n        <if type=\"graphic report\" match=\"any\">\r\n          <text macro=\"archive\"\/>\r\n        <\/if>\r\n        <else-if type=\"article-journal bill book chapter legal_case legislation motion_picture paper-conference\" match=\"none\">\r\n          <text macro=\"archive\"\/>\r\n        <\/else-if>\r\n      <\/choose>\r\n      <choose>\r\n        <if type=\"webpage post-weblog\" match=\"any\">\r\n          <date variable=\"issued\" delimiter=\" \">\r\n            <date-part name=\"month\"\/>\r\n            <date-part name=\"day\"\/>\r\n          <\/date>\r\n        <\/if>\r\n      <\/choose>\r\n      <choose>\r\n        <if variable=\"issued\" match=\"none\">\r\n          <group delimiter=\" \">\r\n            <text term=\"accessed\" text-case=\"capitalize-first\"\/>\r\n            <date variable=\"accessed\" delimiter=\" \">\r\n              <date-part name=\"month\"\/>\r\n              <date-part name=\"day\"\/>\r\n            <\/date>\r\n          <\/group>\r\n        <\/if>\r\n      <\/choose>\r\n      <choose>\r\n        <if type=\"legal_case\" match=\"none\">\r\n          <choose>\r\n            <if variable=\"DOI\">\r\n              <text variable=\"DOI\" prefix=\"doi:\"\/>\r\n            <\/if>\r\n            <else>\r\n              <text variable=\"URL\"\/>\r\n            <\/else>\r\n          <\/choose>\r\n        <\/if>\r\n      <\/choose>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"title\">\r\n    <choose>\r\n      <if variable=\"title\" match=\"none\">\r\n        <choose>\r\n          <if type=\"personal_communication\" match=\"none\">\r\n            <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n          <\/if>\r\n        <\/choose>\r\n      <\/if>\r\n      <else-if type=\"bill book graphic legislation motion_picture report song\" match=\"any\">\r\n        <text variable=\"title\" text-case=\"title\" font-style=\"italic\"\/>\r\n        <group prefix=\" (\" suffix=\")\" delimiter=\" \">\r\n          <text term=\"version\"\/>\r\n          <text variable=\"version\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if variable=\"reviewed-author\">\r\n        <group delimiter=\", \">\r\n          <text variable=\"title\" font-style=\"italic\" prefix=\"Review of \"\/>\r\n          <names variable=\"reviewed-author\">\r\n            <label form=\"verb-short\" text-case=\"lowercase\" suffix=\" \"\/>\r\n            <name and=\"text\" delimiter=\", \"\/>\r\n          <\/names>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"legal_case interview\" match=\"any\">\r\n        <text variable=\"title\"\/>\r\n      <\/else-if>\r\n      <else>\r\n        <text variable=\"title\" text-case=\"title\" quotes=\"true\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"edition\">\r\n    <choose>\r\n      <if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n        <choose>\r\n          <if is-numeric=\"edition\">\r\n            <group delimiter=\" \" prefix=\". \">\r\n              <number variable=\"edition\" form=\"ordinal\"\/>\r\n              <text term=\"edition\" form=\"short\" strip-periods=\"true\"\/>\r\n            <\/group>\r\n          <\/if>\r\n          <else>\r\n            <text variable=\"edition\" prefix=\". \"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n      <else-if type=\"chapter  paper-conference\" match=\"any\">\r\n        <choose>\r\n          <if is-numeric=\"edition\">\r\n            <group delimiter=\" \" prefix=\", \">\r\n              <number variable=\"edition\" form=\"ordinal\"\/>\r\n              <text term=\"edition\" form=\"short\"\/>\r\n            <\/group>\r\n          <\/if>\r\n          <else>\r\n            <text variable=\"edition\" prefix=\", \"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"locators\">\r\n    <choose>\r\n      <if type=\"article-journal\">\r\n        <choose>\r\n          <if variable=\"volume\">\r\n            <text variable=\"volume\" prefix=\" \"\/>\r\n            <group prefix=\" (\" suffix=\")\">\r\n              <choose>\r\n                <if variable=\"issue\">\r\n                  <text variable=\"issue\"\/>\r\n                <\/if>\r\n                <else>\r\n                  <date variable=\"issued\">\r\n                    <date-part name=\"month\"\/>\r\n                  <\/date>\r\n                <\/else>\r\n              <\/choose>\r\n            <\/group>\r\n          <\/if>\r\n          <else-if variable=\"issue\">\r\n            <group delimiter=\" \" prefix=\", \">\r\n              <text term=\"issue\" form=\"short\"\/>\r\n              <text variable=\"issue\"\/>\r\n              <date variable=\"issued\" prefix=\"(\" suffix=\")\">\r\n                <date-part name=\"month\"\/>\r\n              <\/date>\r\n            <\/group>\r\n          <\/else-if>\r\n          <else>\r\n            <date variable=\"issued\" prefix=\", \">\r\n              <date-part name=\"month\"\/>\r\n            <\/date>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n      <else-if type=\"legal_case\">\r\n        <text variable=\"volume\" prefix=\", \"\/>\r\n        <text variable=\"container-title\" prefix=\" \"\/>\r\n        <text variable=\"page\" prefix=\" \"\/>\r\n      <\/else-if>\r\n      <else-if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n        <group prefix=\". \" delimiter=\". \">\r\n          <group>\r\n            <text term=\"volume\" form=\"short\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n            <number variable=\"volume\" form=\"numeric\"\/>\r\n          <\/group>\r\n          <group>\r\n            <number variable=\"number-of-volumes\" form=\"numeric\"\/>\r\n            <text term=\"volume\" form=\"short\" prefix=\" \" plural=\"true\"\/>\r\n          <\/group>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"chapter paper-conference\" match=\"any\">\r\n        <choose>\r\n          <if variable=\"page\" match=\"none\">\r\n            <group prefix=\". \">\r\n              <text term=\"volume\" form=\"short\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n              <number variable=\"volume\" form=\"numeric\"\/>\r\n            <\/group>\r\n          <\/if>\r\n        <\/choose>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"locators-chapter\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference\" match=\"any\">\r\n        <choose>\r\n          <if variable=\"page\">\r\n            <group prefix=\", \">\r\n              <text variable=\"volume\" suffix=\":\"\/>\r\n              <text variable=\"page\"\/>\r\n            <\/group>\r\n          <\/if>\r\n        <\/choose>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"locators-article\">\r\n    <choose>\r\n      <if type=\"article-newspaper\">\r\n        <group prefix=\", \" delimiter=\", \">\r\n          <group>\r\n            <text variable=\"edition\" suffix=\" \"\/>\r\n            <text term=\"edition\" prefix=\" \"\/>\r\n          <\/group>\r\n          <group>\r\n            <text term=\"section\" form=\"short\" suffix=\" \"\/>\r\n            <text variable=\"section\"\/>\r\n          <\/group>\r\n        <\/group>\r\n      <\/if>\r\n      <else-if type=\"article-journal\">\r\n        <choose>\r\n          <if variable=\"volume issue\" match=\"any\">\r\n            <text variable=\"page\" prefix=\": \"\/>\r\n          <\/if>\r\n          <else>\r\n            <text variable=\"page\" prefix=\", \"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"point-locators\">\r\n    <choose>\r\n      <if variable=\"locator\">\r\n        <choose>\r\n          <if locator=\"page\" match=\"none\">\r\n            <choose>\r\n              <if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n                <choose>\r\n                  <if variable=\"volume\">\r\n                    <group>\r\n                      <text term=\"volume\" form=\"short\" suffix=\" \"\/>\r\n                      <number variable=\"volume\" form=\"numeric\"\/>\r\n                      <label variable=\"locator\" form=\"short\" prefix=\", \" suffix=\" \"\/>\r\n                    <\/group>\r\n                  <\/if>\r\n                  <else>\r\n                    <label variable=\"locator\" form=\"short\" suffix=\" \"\/>\r\n                  <\/else>\r\n                <\/choose>\r\n              <\/if>\r\n              <else>\r\n                <label variable=\"locator\" form=\"short\" suffix=\" \"\/>\r\n              <\/else>\r\n            <\/choose>\r\n          <\/if>\r\n          <else-if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n            <number variable=\"volume\" form=\"numeric\" suffix=\":\"\/>\r\n          <\/else-if>\r\n        <\/choose>\r\n        <text variable=\"locator\"\/>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"container-prefix\">\r\n    <text term=\"in\" text-case=\"capitalize-first\"\/>\r\n  <\/macro>\r\n  <macro name=\"container-title\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference\" match=\"any\">\r\n        <text macro=\"container-prefix\" suffix=\" \"\/>\r\n      <\/if>\r\n    <\/choose>\r\n    <choose>\r\n      <if type=\"legal_case\" match=\"none\">\r\n        <text variable=\"container-title\" text-case=\"title\" font-style=\"italic\"\/>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"publisher\">\r\n    <group delimiter=\": \">\r\n      <text variable=\"publisher-place\"\/>\r\n      <text variable=\"publisher\"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"date\">\r\n    <choose>\r\n      <if variable=\"issued\">\r\n        <date variable=\"issued\">\r\n          <date-part name=\"year\"\/>\r\n        <\/date>\r\n      <\/if>\r\n      <else-if variable=\"accessed\">\r\n        <date variable=\"accessed\">\r\n          <date-part name=\"year\"\/>\r\n        <\/date>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"day-month\">\r\n    <date variable=\"issued\">\r\n      <date-part name=\"month\"\/>\r\n      <date-part name=\"day\" prefix=\" \"\/>\r\n    <\/date>\r\n  <\/macro>\r\n  <macro name=\"collection-title\">\r\n    <choose>\r\n      <if match=\"none\" type=\"article-journal\">\r\n        <choose>\r\n          <if match=\"none\" is-numeric=\"collection-number\">\r\n            <group delimiter=\", \">\r\n              <text variable=\"collection-title\" text-case=\"title\"\/>\r\n              <text variable=\"collection-number\"\/>\r\n            <\/group>\r\n          <\/if>\r\n          <else>\r\n            <group delimiter=\" \">\r\n              <text variable=\"collection-title\" text-case=\"title\"\/>\r\n              <text variable=\"collection-number\"\/>\r\n            <\/group>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"collection-title-journal\">\r\n    <choose>\r\n      <if type=\"article-journal\">\r\n        <group delimiter=\" \">\r\n          <text variable=\"collection-title\"\/>\r\n          <text variable=\"collection-number\"\/>\r\n        <\/group>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"event\">\r\n    <group>\r\n      <text term=\"presented at\" suffix=\" \"\/>\r\n      <text variable=\"event\"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"description\">\r\n    <choose>\r\n      <if type=\"interview\">\r\n        <group delimiter=\". \">\r\n          <text macro=\"interviewer\"\/>\r\n          <text variable=\"medium\" text-case=\"capitalize-first\"\/>\r\n        <\/group>\r\n      <\/if>\r\n      <else>\r\n        <text variable=\"medium\" text-case=\"capitalize-first\" prefix=\". \"\/>\r\n      <\/else>\r\n    <\/choose>\r\n    <choose>\r\n      <if variable=\"title\" match=\"none\"\/>\r\n      <else-if type=\"thesis personal_communication speech\" match=\"any\"\/>\r\n      <else>\r\n        <group delimiter=\" \" prefix=\". \">\r\n          <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n          <choose>\r\n            <if type=\"report\">\r\n              <text variable=\"number\"\/>\r\n            <\/if>\r\n          <\/choose>\r\n        <\/group>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"issue\">\r\n    <choose>\r\n      <if type=\"legal_case\">\r\n        <text variable=\"authority\" prefix=\". \"\/>\r\n      <\/if>\r\n      <else-if type=\"speech\">\r\n        <group prefix=\". \" delimiter=\", \">\r\n          <group delimiter=\" \">\r\n            <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n            <text macro=\"event\"\/>\r\n          <\/group>\r\n          <text variable=\"event-place\"\/>\r\n          <text macro=\"day-month\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"article-newspaper article-magazine personal_communication\" match=\"any\">\r\n        <text macro=\"day-month\" prefix=\", \"\/>\r\n      <\/else-if>\r\n      <else>\r\n        <group prefix=\". \" delimiter=\", \">\r\n          <choose>\r\n            <if type=\"thesis\">\r\n              <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n            <\/if>\r\n          <\/choose>\r\n          <text macro=\"publisher\"\/>\r\n        <\/group>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <citation et-al-min=\"4\" et-al-use-first=\"1\" disambiguate-add-year-suffix=\"true\" disambiguate-add-names=\"true\" disambiguate-add-givenname=\"true\" givenname-disambiguation-rule=\"primary-name\">\r\n    <layout prefix=\"(\" suffix=\")\" delimiter=\"; \">\r\n      <group delimiter=\", \">\r\n        <group delimiter=\" \">\r\n          <text macro=\"contributors-short\"\/>\r\n          <text macro=\"date\"\/>\r\n        <\/group>\r\n        <text macro=\"point-locators\"\/>\r\n      <\/group>\r\n    <\/layout>\r\n  <\/citation>\r\n  <bibliography hanging-indent=\"true\" et-al-min=\"11\" et-al-use-first=\"7\" subsequent-author-substitute=\"&#8212;&#8212;&#8212;\" entry-spacing=\"0\">\r\n    <sort>\r\n      <key macro=\"contributors\"\/>\r\n      <key variable=\"issued\"\/>\r\n    <\/sort>\r\n    <layout suffix=\".\">\r\n      <group delimiter=\". \">\r\n        <text macro=\"contributors\"\/>\r\n        <text macro=\"date\"\/>\r\n        <text macro=\"title\"\/>\r\n      <\/group>\r\n      <text macro=\"description\"\/>\r\n      <text macro=\"secondary-contributors\" prefix=\". \"\/>\r\n      <text macro=\"container-title\" prefix=\". \"\/>\r\n      <text macro=\"container-contributors\"\/>\r\n      <text macro=\"edition\"\/>\r\n      <text macro=\"locators-chapter\"\/>\r\n      <text macro=\"collection-title-journal\" prefix=\", \" suffix=\", \"\/>\r\n      <text macro=\"locators\"\/>\r\n      <text macro=\"collection-title\" prefix=\". \"\/>\r\n      <text macro=\"issue\"\/>\r\n      <text macro=\"locators-article\"\/>\r\n      <text macro=\"access\" prefix=\". \"\/>\r\n    <\/layout>\r\n  <\/bibliography>\r\n<\/style>";
	var styleAPA = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<style xmlns=\"http:\/\/purl.org\/net\/xbiblio\/csl\" class=\"in-text\" version=\"1.0\" demote-non-dropping-particle=\"never\">\r\n  <!-- This style was edited with the Visual CSL Editor (http:\/\/editor.citationstyles.org\/visualEditor\/) -->\r\n  <info>\r\n    <title>American Psychological Association 6th edition<\/title>\r\n    <title-short>APA<\/title-short>\r\n    <id>http:\/\/www.zotero.org\/styles\/apa<\/id>\r\n    <link href=\"http:\/\/www.zotero.org\/styles\/apa\" rel=\"self\"\/>\r\n    <link href=\"http:\/\/owl.english.purdue.edu\/owl\/resource\/560\/01\/\" rel=\"documentation\"\/>\r\n    <author>\r\n      <name>Simon Kornblith<\/name>\r\n      <email>simon@simonster.com<\/email>\r\n    <\/author>\r\n    <contributor>\r\n      <name>Bruce D\'Arcus<\/name>\r\n    <\/contributor>\r\n    <contributor>\r\n      <name>Curtis M. Humphrey<\/name>\r\n    <\/contributor>\r\n    <contributor>\r\n      <name>Richard Karnesky<\/name>\r\n      <email>karnesky+zotero@gmail.com<\/email>\r\n      <uri>http:\/\/arc.nucapt.northwestern.edu\/Richard_Karnesky<\/uri>\r\n    <\/contributor>\r\n    <contributor>\r\n      <name>Sebastian Karcher<\/name>\r\n    <\/contributor>\r\n    <category citation-format=\"author-date\"\/>\r\n    <category field=\"psychology\"\/>\r\n    <category field=\"generic-base\"\/>\r\n    <updated>2014-09-23T19:13:50+00:00<\/updated>\r\n    <rights license=\"http:\/\/creativecommons.org\/licenses\/by-sa\/3.0\/\">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License<\/rights>\r\n  <\/info>\r\n  <locale xml:lang=\"en\">\r\n    <terms>\r\n      <term name=\"editortranslator\" form=\"short\">\r\n        <single>ed. &amp; trans.<\/single>\r\n        <multiple>eds. &amp; trans.<\/multiple>\r\n      <\/term>\r\n      <term name=\"translator\" form=\"short\">\r\n        <single>trans.<\/single>\r\n        <multiple>trans.<\/multiple>\r\n      <\/term>\r\n    <\/terms>\r\n  <\/locale>\r\n  <macro name=\"container-contributors\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference entry-dictionary entry-encyclopedia\" match=\"any\">\r\n        <names variable=\"editor translator container-author\" delimiter=\", \" suffix=\", \">\r\n          <name and=\"symbol\" initialize-with=\". \" delimiter=\", \"\/>\r\n          <label form=\"short\" prefix=\" (\" text-case=\"title\" suffix=\")\"\/>\r\n        <\/names>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"secondary-contributors\">\r\n    <choose>\r\n      <if type=\"article-journal chapter paper-conference entry-dictionary entry-encyclopedia\" match=\"none\">\r\n        <names variable=\"translator editor container-author\" delimiter=\", \" prefix=\" (\" suffix=\")\">\r\n          <name and=\"symbol\" initialize-with=\". \" delimiter=\", \"\/>\r\n          <label form=\"short\" prefix=\", \" text-case=\"title\"\/>\r\n        <\/names>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"author\">\r\n    <names variable=\"author\">\r\n      <name name-as-sort-order=\"all\" and=\"symbol\" sort-separator=\", \" initialize-with=\". \" delimiter=\", \" delimiter-precedes-last=\"always\"\/>\r\n      <label form=\"short\" prefix=\" (\" suffix=\")\" text-case=\"capitalize-first\"\/>\r\n      <substitute>\r\n        <names variable=\"editor\"\/>\r\n        <names variable=\"translator\"\/>\r\n        <choose>\r\n          <if type=\"report\">\r\n            <text variable=\"publisher\"\/>\r\n            <text macro=\"title\"\/>\r\n          <\/if>\r\n          <else>\r\n            <text macro=\"title\"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/substitute>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"author-short\">\r\n    <names variable=\"author\">\r\n      <name form=\"short\" and=\"symbol\" delimiter=\", \" initialize-with=\". \"\/>\r\n      <substitute>\r\n        <names variable=\"editor\"\/>\r\n        <names variable=\"translator\"\/>\r\n        <choose>\r\n          <if type=\"report\">\r\n            <text variable=\"publisher\"\/>\r\n            <text variable=\"title\" form=\"short\" font-style=\"italic\"\/>\r\n          <\/if>\r\n          <else-if type=\"legal_case\">\r\n            <text variable=\"title\" font-style=\"italic\"\/>\r\n          <\/else-if>\r\n          <else-if type=\"bill book graphic legislation motion_picture song\" match=\"any\">\r\n            <text variable=\"title\" form=\"short\" font-style=\"italic\"\/>\r\n          <\/else-if>\r\n          <else>\r\n            <text variable=\"title\" form=\"short\" quotes=\"true\"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/substitute>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"access\">\r\n    <choose>\r\n      <if type=\"thesis\">\r\n        <choose>\r\n          <if variable=\"archive\" match=\"any\">\r\n            <group>\r\n              <text term=\"retrieved\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n              <text term=\"from\" suffix=\" \"\/>\r\n              <text variable=\"archive\" suffix=\".\"\/>\r\n              <text variable=\"archive_location\" prefix=\" (\" suffix=\")\"\/>\r\n            <\/group>\r\n          <\/if>\r\n          <else>\r\n            <group>\r\n              <text term=\"retrieved\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n              <text term=\"from\" suffix=\" \"\/>\r\n              <text variable=\"URL\"\/>\r\n            <\/group>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n      <else>\r\n        <choose>\r\n          <if variable=\"DOI\">\r\n            <text variable=\"DOI\" prefix=\"doi:\"\/>\r\n          <\/if>\r\n          <else>\r\n            <choose>\r\n              <if type=\"webpage\">\r\n                <group delimiter=\" \">\r\n                  <text term=\"retrieved\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n                  <group>\r\n                    <date variable=\"accessed\" form=\"text\" suffix=\", \"\/>\r\n                  <\/group>\r\n                  <text term=\"from\"\/>\r\n                  <text variable=\"URL\"\/>\r\n                <\/group>\r\n              <\/if>\r\n              <else>\r\n                <group>\r\n                  <text term=\"retrieved\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n                  <text term=\"from\" suffix=\" \"\/>\r\n                  <text variable=\"URL\"\/>\r\n                <\/group>\r\n              <\/else>\r\n            <\/choose>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"title\">\r\n    <choose>\r\n      <if type=\"report thesis book graphic motion_picture report song manuscript speech\" match=\"any\">\r\n        <choose>\r\n          <if variable=\"version\">\r\n            <!---This is a hack until we have a computer program type -->\r\n            <text variable=\"title\"\/>\r\n          <\/if>\r\n          <else>\r\n            <text variable=\"title\" font-style=\"italic\"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n      <else>\r\n        <text variable=\"title\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"title-plus-extra\">\r\n    <text macro=\"title\"\/>\r\n    <choose>\r\n      <if type=\"report thesis\" match=\"any\">\r\n        <group prefix=\" (\" suffix=\")\" delimiter=\" \">\r\n          <text variable=\"genre\"\/>\r\n          <text variable=\"number\" prefix=\"No. \"\/>\r\n        <\/group>\r\n      <\/if>\r\n      <else-if type=\"post-weblog webpage\" match=\"any\">\r\n        <text variable=\"genre\" prefix=\" [\" suffix=\"]\"\/>\r\n      <\/else-if>\r\n      <else-if variable=\"version\">\r\n        <group delimiter=\" \" prefix=\" (\" suffix=\")\">\r\n          <text term=\"version\" text-case=\"capitalize-first\"\/>\r\n          <text variable=\"version\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"publisher\">\r\n    <choose>\r\n      <if type=\"report\" match=\"any\">\r\n        <group delimiter=\": \">\r\n          <text variable=\"publisher-place\"\/>\r\n          <text variable=\"publisher\"\/>\r\n        <\/group>\r\n      <\/if>\r\n      <else-if type=\"thesis\" match=\"any\">\r\n        <group delimiter=\", \">\r\n          <text variable=\"publisher\"\/>\r\n          <text variable=\"publisher-place\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"post-weblog webpage\" match=\"none\">\r\n        <group delimiter=\", \">\r\n          <choose>\r\n            <if variable=\"event\" type=\"speech\" match=\"none\">\r\n              <text variable=\"genre\"\/>\r\n            <\/if>\r\n          <\/choose>\r\n          <choose>\r\n            <if type=\"article-journal article-magazine\" match=\"none\">\r\n              <group delimiter=\": \">\r\n                <choose>\r\n                  <if variable=\"publisher-place\">\r\n                    <text variable=\"publisher-place\"\/>\r\n                  <\/if>\r\n                  <else>\r\n                    <text variable=\"event-place\"\/>\r\n                  <\/else>\r\n                <\/choose>\r\n                <text variable=\"publisher\"\/>\r\n              <\/group>\r\n            <\/if>\r\n          <\/choose>\r\n        <\/group>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"event\">\r\n    <choose>\r\n      <if variable=\"container-title\" match=\"none\">\r\n        <choose>\r\n          <if variable=\"event\">\r\n            <choose>\r\n              <if variable=\"genre\" match=\"none\">\r\n                <text term=\"presented at\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n                <text variable=\"event\"\/>\r\n              <\/if>\r\n              <else>\r\n                <group delimiter=\" \">\r\n                  <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n                  <text term=\"presented at\"\/>\r\n                  <text variable=\"event\"\/>\r\n                <\/group>\r\n              <\/else>\r\n            <\/choose>\r\n          <\/if>\r\n          <else-if type=\"speech\">\r\n            <text variable=\"genre\" text-case=\"capitalize-first\"\/>\r\n          <\/else-if>\r\n        <\/choose>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"issued\">\r\n    <choose>\r\n      <if type=\"bill legal_case legislation\" match=\"none\">\r\n        <choose>\r\n          <if variable=\"issued\">\r\n            <group prefix=\" (\" suffix=\")\">\r\n              <date variable=\"issued\">\r\n                <date-part name=\"year\"\/>\r\n              <\/date>\r\n              <text variable=\"year-suffix\"\/>\r\n              <choose>\r\n                <if type=\"article-journal bill book chapter graphic legal_case legislation motion_picture paper-conference report song\" match=\"none\">\r\n                  <date variable=\"issued\">\r\n                    <date-part prefix=\", \" name=\"month\"\/>\r\n                    <date-part prefix=\" \" name=\"day\"\/>\r\n                  <\/date>\r\n                <\/if>\r\n              <\/choose>\r\n            <\/group>\r\n          <\/if>\r\n          <else>\r\n            <group prefix=\" (\" suffix=\")\">\r\n              <text term=\"no date\" form=\"short\"\/>\r\n              <text variable=\"year-suffix\" prefix=\"-\"\/>\r\n            <\/group>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"issued-sort\">\r\n    <choose>\r\n      <if type=\"article-journal bill book chapter graphic legal_case legislation motion_picture paper-conference report song\" match=\"none\">\r\n        <date variable=\"issued\">\r\n          <date-part name=\"year\"\/>\r\n          <date-part name=\"month\"\/>\r\n          <date-part name=\"day\"\/>\r\n        <\/date>\r\n      <\/if>\r\n      <else>\r\n        <date variable=\"issued\">\r\n          <date-part name=\"year\"\/>\r\n        <\/date>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"issued-year\">\r\n    <choose>\r\n      <if variable=\"issued\">\r\n        <date variable=\"issued\">\r\n          <date-part name=\"year\"\/>\r\n        <\/date>\r\n        <text variable=\"year-suffix\"\/>\r\n      <\/if>\r\n      <else>\r\n        <text term=\"no date\" form=\"short\"\/>\r\n        <text variable=\"year-suffix\" prefix=\"-\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"edition\">\r\n    <choose>\r\n      <if is-numeric=\"edition\">\r\n        <group delimiter=\" \">\r\n          <number variable=\"edition\" form=\"ordinal\"\/>\r\n          <text term=\"edition\" form=\"short\"\/>\r\n        <\/group>\r\n      <\/if>\r\n      <else>\r\n        <text variable=\"edition\" suffix=\".\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"locators\">\r\n    <choose>\r\n      <if type=\"article-journal article-magazine\" match=\"any\">\r\n        <group prefix=\", \" delimiter=\", \">\r\n          <group>\r\n            <text variable=\"volume\" font-style=\"italic\"\/>\r\n            <text variable=\"issue\" prefix=\"(\" suffix=\")\"\/>\r\n          <\/group>\r\n          <text variable=\"page\"\/>\r\n        <\/group>\r\n      <\/if>\r\n      <else-if type=\"article-newspaper\">\r\n        <group delimiter=\" \" prefix=\", \">\r\n          <label variable=\"page\" form=\"short\"\/>\r\n          <text variable=\"page\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"book graphic motion_picture report song chapter paper-conference entry-encyclopedia entry-dictionary\" match=\"any\">\r\n        <group prefix=\" (\" suffix=\")\" delimiter=\", \">\r\n          <text macro=\"edition\"\/>\r\n          <group>\r\n            <text term=\"volume\" form=\"short\" plural=\"true\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n            <number variable=\"number-of-volumes\" form=\"numeric\" prefix=\"1-\"\/>\r\n          <\/group>\r\n          <group>\r\n            <text term=\"volume\" form=\"short\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n            <number variable=\"volume\" form=\"numeric\"\/>\r\n          <\/group>\r\n          <group>\r\n            <label variable=\"page\" form=\"short\" suffix=\" \"\/>\r\n            <text variable=\"page\"\/>\r\n          <\/group>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"legal_case\">\r\n        <group prefix=\" (\" suffix=\")\" delimiter=\" \">\r\n          <text variable=\"authority\"\/>\r\n          <date variable=\"issued\" form=\"text\"\/>\r\n        <\/group>\r\n      <\/else-if>\r\n      <else-if type=\"bill legislation\" match=\"any\">\r\n        <date variable=\"issued\" prefix=\" (\" suffix=\")\">\r\n          <date-part name=\"year\"\/>\r\n        <\/date>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"citation-locator\">\r\n    <group>\r\n      <choose>\r\n        <if locator=\"chapter\">\r\n          <label variable=\"locator\" form=\"long\" text-case=\"capitalize-first\"\/>\r\n        <\/if>\r\n        <else>\r\n          <label variable=\"locator\" form=\"short\"\/>\r\n        <\/else>\r\n      <\/choose>\r\n      <text variable=\"locator\" prefix=\" \"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"container\">\r\n    <choose>\r\n      <if type=\"post-weblog webpage\" match=\"none\">\r\n        <group>\r\n          <choose>\r\n            <if type=\"chapter paper-conference entry-encyclopedia\" match=\"any\">\r\n              <text term=\"in\" text-case=\"capitalize-first\" suffix=\" \"\/>\r\n            <\/if>\r\n          <\/choose>\r\n          <text macro=\"container-contributors\"\/>\r\n          <text macro=\"secondary-contributors\"\/>\r\n          <text macro=\"container-title\"\/>\r\n        <\/group>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"container-title\">\r\n    <choose>\r\n      <if type=\"article article-journal article-magazine article-newspaper\" match=\"any\">\r\n        <text variable=\"container-title\" font-style=\"italic\" text-case=\"title\"\/>\r\n      <\/if>\r\n      <else-if type=\"bill legal_case legislation\" match=\"none\">\r\n        <text variable=\"container-title\" font-style=\"italic\"\/>\r\n      <\/else-if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"legal-cites\">\r\n    <choose>\r\n      <if type=\"bill legal_case legislation\" match=\"any\">\r\n        <group delimiter=\" \" prefix=\", \">\r\n          <choose>\r\n            <if variable=\"container-title\">\r\n              <text variable=\"volume\"\/>\r\n              <text variable=\"container-title\"\/>\r\n              <group delimiter=\" \">\r\n                <!--change to label variable=\"section\" as that becomes available -->\r\n                <text term=\"section\" form=\"symbol\"\/>\r\n                <text variable=\"section\"\/>\r\n              <\/group>\r\n              <text variable=\"page\"\/>\r\n            <\/if>\r\n            <else>\r\n              <choose>\r\n                <if type=\"legal_case\">\r\n                  <text variable=\"number\" prefix=\"No. \"\/>\r\n                <\/if>\r\n                <else>\r\n                  <text variable=\"number\" prefix=\"Pub. L. No. \"\/>\r\n                  <group delimiter=\" \">\r\n                    <!--change to label variable=\"section\" as that becomes available -->\r\n                    <text term=\"section\" form=\"symbol\"\/>\r\n                    <text variable=\"section\"\/>\r\n                  <\/group>\r\n                <\/else>\r\n              <\/choose>\r\n            <\/else>\r\n          <\/choose>\r\n        <\/group>\r\n      <\/if>\r\n    <\/choose>\r\n  <\/macro>\r\n  <citation et-al-min=\"6\" et-al-use-first=\"1\" et-al-subsequent-min=\"3\" et-al-subsequent-use-first=\"1\" disambiguate-add-year-suffix=\"true\" disambiguate-add-names=\"true\" disambiguate-add-givenname=\"true\" collapse=\"year\" givenname-disambiguation-rule=\"primary-name\">\r\n    <sort>\r\n      <key macro=\"author\"\/>\r\n      <key macro=\"issued-sort\"\/>\r\n    <\/sort>\r\n    <layout prefix=\"(\" suffix=\")\" delimiter=\"; \">\r\n      <group delimiter=\", \">\r\n        <text macro=\"author-short\"\/>\r\n        <text macro=\"issued-year\"\/>\r\n        <text macro=\"citation-locator\"\/>\r\n      <\/group>\r\n    <\/layout>\r\n  <\/citation>\r\n  <bibliography hanging-indent=\"true\" et-al-min=\"8\" et-al-use-first=\"6\" et-al-use-last=\"true\" entry-spacing=\"0\" line-spacing=\"2\">\r\n    <sort>\r\n      <key macro=\"author\"\/>\r\n      <key macro=\"issued-sort\" sort=\"ascending\"\/>\r\n      <key macro=\"title\"\/>\r\n    <\/sort>\r\n    <layout>\r\n      <group suffix=\".\">\r\n        <group delimiter=\". \">\r\n          <text macro=\"author\"\/>\r\n          <text macro=\"issued\"\/>\r\n          <text macro=\"title-plus-extra\"\/>\r\n          <text macro=\"container\"\/>\r\n        <\/group>\r\n        <text macro=\"legal-cites\"\/>\r\n        <text macro=\"locators\"\/>\r\n        <group delimiter=\", \" prefix=\". \">\r\n          <text macro=\"event\"\/>\r\n          <text macro=\"publisher\"\/>\r\n        <\/group>\r\n      <\/group>\r\n      <text macro=\"access\" prefix=\" \"\/>\r\n    <\/layout>\r\n  <\/bibliography>\r\n<\/style>";
	var styleBibtex = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<style xmlns=\"http:\/\/purl.org\/net\/xbiblio\/csl\" class=\"in-text\" version=\"1.0\" demote-non-dropping-particle=\"sort-only\" default-locale=\"en-US\">\r\n  <info>\r\n    <title>BibTeX generic citation style<\/title>\r\n    <id>http:\/\/www.zotero.org\/styles\/bibtex<\/id>\r\n    <link href=\"http:\/\/www.zotero.org\/styles\/bibtex\" rel=\"self\"\/>\r\n    <link href=\"http:\/\/www.bibtex.org\/\" rel=\"documentation\"\/>\r\n    <author>\r\n      <name>Markus Schaffner<\/name>\r\n    <\/author>\r\n    <contributor>\r\n      <name>Richard Karnesky<\/name>\r\n      <email>karnesky+zotero@gmail.com<\/email>\r\n      <uri>http:\/\/arc.nucapt.northwestern.edu\/Richard_Karnesky<\/uri>\r\n    <\/contributor>\r\n    <category citation-format=\"author-date\"\/>\r\n    <category field=\"generic-base\"\/>\r\n    <updated>2012-09-14T21:22:32+00:00<\/updated>\r\n    <rights license=\"http:\/\/creativecommons.org\/licenses\/by-sa\/3.0\/\">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License<\/rights>\r\n  <\/info>\r\n  <macro name=\"zotero2bibtexType\">\r\n    <choose>\r\n      <if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n        <text value=\"book\"\/>\r\n      <\/if>\r\n      <else-if type=\"chapter paper-conference\" match=\"any\">\r\n        <text value=\"inbook\"\/>\r\n      <\/else-if>\r\n      <else-if type=\"article article-journal article-magazine article-newspaper\" match=\"any\">\r\n        <text value=\"article\"\/>\r\n      <\/else-if>\r\n      <else-if type=\"thesis\" match=\"any\">\r\n        <text value=\"phdthesis\"\/>\r\n      <\/else-if>\r\n      <else-if type=\"manuscript\" match=\"any\">\r\n        <text value=\"unpublished\"\/>\r\n      <\/else-if>\r\n      <else-if type=\"paper-conference\" match=\"any\">\r\n        <text value=\"inproceedings\"\/>\r\n      <\/else-if>\r\n      <else-if type=\"report\" match=\"any\">\r\n        <text value=\"techreport\"\/>\r\n      <\/else-if>\r\n      <else>\r\n        <text value=\"misc\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"citeKey\">\r\n    <group delimiter=\"_\">\r\n      <text macro=\"author-short\" text-case=\"lowercase\"\/>\r\n      <text macro=\"issued-year\"\/>\r\n    <\/group>\r\n  <\/macro>\r\n  <macro name=\"author-short\">\r\n    <names variable=\"author\">\r\n      <name form=\"short\" delimiter=\"_\" delimiter-precedes-last=\"always\"\/>\r\n      <substitute>\r\n        <names variable=\"editor\"\/>\r\n        <names variable=\"translator\"\/>\r\n        <choose>\r\n          <if type=\"bill book graphic legal_case legislation motion_picture report song\" match=\"any\">\r\n            <text variable=\"title\" form=\"short\"\/>\r\n          <\/if>\r\n          <else>\r\n            <text variable=\"title\" form=\"short\"\/>\r\n          <\/else>\r\n        <\/choose>\r\n      <\/substitute>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"issued-year\">\r\n    <date variable=\"issued\">\r\n      <date-part name=\"year\"\/>\r\n    <\/date>\r\n  <\/macro>\r\n  <macro name=\"issued-month\">\r\n    <date variable=\"issued\">\r\n      <date-part name=\"month\" form=\"short\" strip-periods=\"true\"\/>\r\n    <\/date>\r\n  <\/macro>\r\n  <macro name=\"author\">\r\n    <names variable=\"author\">\r\n      <name sort-separator=\", \" delimiter=\" and \" delimiter-precedes-last=\"always\" name-as-sort-order=\"all\"\/>\r\n      <label form=\"long\" text-case=\"capitalize-first\"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"editor-translator\">\r\n    <names variable=\"editor translator\" delimiter=\", \">\r\n      <name sort-separator=\", \" delimiter=\" and \" delimiter-precedes-last=\"always\" name-as-sort-order=\"all\"\/>\r\n      <label form=\"long\" text-case=\"capitalize-first\"\/>\r\n    <\/names>\r\n  <\/macro>\r\n  <macro name=\"title\">\r\n    <text variable=\"title\"\/>\r\n  <\/macro>\r\n  <macro name=\"number\">\r\n    <text variable=\"issue\"\/>\r\n    <text variable=\"number\"\/>\r\n  <\/macro>\r\n  <macro name=\"container-title\">\r\n    <choose>\r\n      <if type=\"chapter paper-conference\" match=\"any\">\r\n        <text variable=\"container-title\" prefix=\" booktitle={\" suffix=\"}\"\/>\r\n      <\/if>\r\n      <else>\r\n        <text variable=\"container-title\" prefix=\" journal={\" suffix=\"}\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"publisher\">\r\n    <choose>\r\n      <if type=\"thesis\">\r\n        <text variable=\"publisher\" prefix=\" school={\" suffix=\"}\"\/>\r\n      <\/if>\r\n      <else-if type=\"report\">\r\n        <text variable=\"publisher\" prefix=\" institution={\" suffix=\"}\"\/>\r\n      <\/else-if>\r\n      <else>\r\n        <text variable=\"publisher\" prefix=\" publisher={\" suffix=\"}\"\/>\r\n      <\/else>\r\n    <\/choose>\r\n  <\/macro>\r\n  <macro name=\"pages\">\r\n    <text variable=\"page\"\/>\r\n  <\/macro>\r\n  <macro name=\"edition\">\r\n    <text variable=\"edition\"\/>\r\n  <\/macro>\r\n  <citation et-al-min=\"10\" et-al-use-first=\"10\" disambiguate-add-year-suffix=\"true\" disambiguate-add-names=\"false\" disambiguate-add-givenname=\"false\" collapse=\"year\">\r\n    <sort>\r\n      <key macro=\"author\"\/>\r\n      <key variable=\"issued\"\/>\r\n    <\/sort>\r\n    <layout delimiter=\"_\">\r\n      <text macro=\"citeKey\"\/>\r\n    <\/layout>\r\n  <\/citation>\r\n  <bibliography hanging-indent=\"false\" et-al-min=\"10\" et-al-use-first=\"10\">\r\n    <sort>\r\n      <key macro=\"author\"\/>\r\n      <key variable=\"issued\"\/>\r\n    <\/sort>\r\n    <layout>\r\n      <text macro=\"zotero2bibtexType\" prefix=\" @\"\/>\r\n      <group prefix=\"{\" suffix=\"}\" delimiter=\", \">\r\n        <text macro=\"citeKey\"\/>\r\n        <text variable=\"publisher-place\" prefix=\" place={\" suffix=\"}\"\/>\r\n        <!--Fix This-->\r\n        <text variable=\"chapter-number\" prefix=\" chapter={\" suffix=\"}\"\/>\r\n        <!--Fix This-->\r\n        <text macro=\"edition\" prefix=\" edition={\" suffix=\"}\"\/>\r\n        <!--Is this in CSL? <text variable=\"type\" prefix=\" type={\" suffix=\"}\"\/>-->\r\n        <text variable=\"collection-title\" prefix=\" series={\" suffix=\"}\"\/>\r\n        <text macro=\"title\" prefix=\" title={\" suffix=\"}\"\/>\r\n        <text variable=\"volume\" prefix=\" volume={\" suffix=\"}\"\/>\r\n        <!--Not in CSL<text variable=\"rights\" prefix=\" rights={\" suffix=\"}\"\/>-->\r\n        <text variable=\"ISBN\" prefix=\" ISBN={\" suffix=\"}\"\/>\r\n        <text variable=\"ISSN\" prefix=\" ISSN={\" suffix=\"}\"\/>\r\n        <!--Not in CSL <text variable=\"LCCN\" prefix=\" callNumber={\" suffix=\"}\"\/>-->\r\n        <text variable=\"archive_location\" prefix=\" archiveLocation={\" suffix=\"}\"\/>\r\n        <text variable=\"URL\" prefix=\" url={\" suffix=\"}\"\/>\r\n        <text variable=\"DOI\" prefix=\" DOI={\" suffix=\"}\"\/>\r\n        <text variable=\"abstract\" prefix=\" abstractNote={\" suffix=\"}\"\/>\r\n        <text variable=\"note\" prefix=\" note={\" suffix=\"}\"\/>\r\n        <text macro=\"number\" prefix=\" number={\" suffix=\"}\"\/>\r\n        <text macro=\"container-title\"\/>\r\n        <text macro=\"publisher\"\/>\r\n        <text macro=\"author\" prefix=\" author={\" suffix=\"}\"\/>\r\n        <text macro=\"editor-translator\" prefix=\" editor={\" suffix=\"}\"\/>\r\n        <text macro=\"issued-year\" prefix=\" year={\" suffix=\"}\"\/>\r\n        <text macro=\"issued-month\" prefix=\" month={\" suffix=\"}\"\/>\r\n        <text macro=\"pages\" prefix=\" pages={\" suffix=\"}\"\/>\r\n        <text variable=\"collection-title\" prefix=\" collection={\" suffix=\"}\"\/>\r\n      <\/group>\r\n    <\/layout>\r\n  <\/bibliography>\r\n<\/style>";
	
	//create a CSL.Engine - defaults to chicago style and build in citeprocSYS if undefined
	function createCiteproc(citeprocJSONObject, citeprocSys, citeprocStyle){
		
		//console.log(citeprocJSONObject);
		var defaultCiteprocSys = {
		    retrieveItem: function(id){
		        return citeprocJSONObject.citationItems[id];
		    },
		    retrieveLocale: function(lang){
		        return defaultLocale[lang];
		    }
		}

		if (!citeprocSys)
			citeprocSys = defaultCiteprocSys;
		if (!citeprocStyle)
			citeprocStyle = styleChigcagoAD;
		

		return new CSL.Engine( citeprocSys, citeprocStyle );
	}

	//with thanks to http://stackoverflow.com/questions/23774231/how-do-i-remove-all-null-and-empty-string-values-from-a-json-object
	function removeNullsInObject(obj) {
	    if( typeof obj === 'string' ){ return; }
	    $.each(obj, function(key, value){
	        if (value === "" || value === null){
	            delete obj[key];
	        } else if ($.isArray(value)) {
	            if( value.length === 0 ){ delete obj[key]; return; }
	            $.each(value, function (k,v) {
	                removeNullsInObject(v);
	            });
	        } else if (typeof value === 'object') {
	            if( Object.keys(value).length === 0 ){ 
	                delete obj[key]; return; 
	            }
	            removeNullsInObject(value);
	        }
	    }); 
	}

	function arrReverse(obj){
		
			let newObj = [];
		  
			Object.keys(obj)
			  .sort().reverse()
			  .forEach((key) => {
				//console.log(key);
				newObj.push(key);
				// console.log(obj[key]);
				// newObj[key] = obj[key];
			  })
		  
			//console.log(newObj);
		return newObj;
	}

	// Sorting Citation json data according to year
	function yearSort(results){
		
		console.log(results);
		let yearArr = [];
		let newArr = [];
		results.forEach(rs => {
			if("issued" in rs){
				var key = rs.issued["date-parts"][0][0];
				//console.log(rs);
				if(key in newArr){
					newArr[key].push(rs);
				}else{
					newArr[key] = [];
					newArr[key].push(rs);
				}
				
				//console.log(key);
			}else{
				newArr['0'] = [];
				newArr['0'].push(rs);
			}
			
		})
		
		yearArr.push(arrReverse(newArr));
		yearArr.push(newArr.reverse());
		
		return yearArr;
	}
	
	//Convert citation json to html
	function finalCitationOutput(callback, optionalCitationStyle, rs, returnCiteprocObjects, divID, frontStyl, year){
		var citeprocJSONArray = [];
				var failArray = [];
				var id = 0;
				
				//console.log(rs);
				for (r in rs){					
					citeprocJSONArray[id] = rs[r];
					citeprocJSONArray[id].id = ""+id;
					//we have to remove nulls as they cause citeproc.js to fail.
					removeNullsInObject(citeprocJSONArray[id]);
					id++;
				}
				if (returnCiteprocObjects){
					callback(citeprocJSONArray);
					return;
				}
				var citeprocJSONObject = {
					"citationItems":citeprocJSONArray,
					"properties": {
						"noteIndex": 0
					},
				};
				
				// note we can check for failiures by looking at .originalOrder property
				citeproc = orcid.createCiteproc(citeprocJSONObject,null,optionalCitationStyle);
				
				
				citeproc.appendCitationCluster(citeprocJSONObject);
				
				citations = citeproc.makeBibliography()[1];
				document.getElementById(divID.substring(1)).parentNode.previousElementSibling.style.display = 'none';
				return callback(citations,failArray, year, divID, frontStyl);
	}

	function createElement(year, divID){
		var newDiv = document.createElement("div"); 
		newDiv.setAttribute("id",year+"-container");
		newDiv.classList.add('year-div');
		//newDiv.innerHTML = citations;
        //console.log(divID);
		$(divID).append(newDiv);

	}

	//Given an ORCID ID, fetch all the works as citations.
	//defaults to chicago style, but any CSL can be used.
	//will return citeproc objects if flag is set.
	function resolveCitationsFromORCIDID(callback, optionalCitationStyle, results, divID, frontStyl, styl, returnCiteprocObjects){
		
		//console.log(divID);

		if(styl == 'ieee' && frontStyl != '1'){
				//private function that turns XHR results into citeproc citations
				finalCitationOutput(callback, optionalCitationStyle, results, returnCiteprocObjects,divID,frontStyl);
			
		}else if(styl == 'vancouver' && frontStyl != '1'){
			//private function that turns XHR results into citeproc citations
			finalCitationOutput(callback, optionalCitationStyle, results, returnCiteprocObjects,divID,frontStyl);
		}else if(styl == 'acm-sig-proceedings' && frontStyl != '1'){
			//private function that turns XHR results into citeproc citations
			finalCitationOutput(callback, optionalCitationStyle, results, returnCiteprocObjects,divID,frontStyl);
		}else{	
			let d = yearSort(results);
			let i = 0;
			let year = d['0'];
			//console.log(d)
			d['1'].forEach(rs => {				
				if(frontStyl == '1'){
					if(year[i] != '0'){
						createElement(year[i], divID);
						let h = '<h3 class="cita-year">'+year[i]+'</h3>';
						$("#"+year[i]+"-container").append(h);
						finalCitationOutput(callback, optionalCitationStyle, rs, returnCiteprocObjects, divID,frontStyl, year[i]);
					}else{				
						createElement('other', divID);
						let ye = 'other';
						$("#other-container").append('<h3 class="cita-year">Other</h3>');
						finalCitationOutput(callback, optionalCitationStyle, rs, returnCiteprocObjects, divID,frontStyl, ye);
					}
					
				}else{
					finalCitationOutput(callback, optionalCitationStyle, rs, returnCiteprocObjects,frontStyl, divID);
				}	
				
				i++;
			});
		}
			
		if (frontStyl == '1') {
					$(divID).addClass('bg-none');
			}

		
	}

	//public interface
	return {
		init:createPublicV2ORCIDClient,
		activitiesToSimpleWorks:activitiesToSimpleWorks,
		appendSimpleWorksToElement:appendSimpleWorksToElement,
		createCiteproc:createCiteproc,
		fetchCiteprocJSONForSimpleWorks:fetchCiteprocJSONForSimpleWorks,
		fetchCiteprocJSONForSimpleWorksOneByOne:fetchCiteprocJSONForSimpleWorksOneByOne,
		//main utility functions
		resolveCitations:resolveCitationsFromORCIDID,
		//constants
		styleBibtex:styleBibtex,
		styleAPA:styleAPA,
		client:client
	}
}();
