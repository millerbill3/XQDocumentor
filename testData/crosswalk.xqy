xquery version "1.0-ml";
module namespace crosswalk = "http://marklogic.com/sof/data-sources/comtex_bbcmon/crosswalk";
(:~ 
 : Copyright 2014, MarkLogic Corporation. All Rights Reserved. 
 :
 : This module is responsible for mapping the COMTEX/BBCMON producer's
 : document values to valid DDMS v2.0.
 :
 : @author Bill Miller, MarkLogic Corporation
 : @version 1.0
:)

(:: Imports ::)
import module namespace dcgs-ds 		= "http://marklogic.com/ps/dcgs-datasources" at "/data-sources/lib/dcgs-datasources.xqy";
import module namespace dcgs-ddms 	= "http://marklogic.com/ps/dcgs-ddms" at "/data-sources/lib/dcgs-ddms2.xqy";
import module namespace mem        	= "http://xqdev.com/in-mem-update" at "/ingest/lib/in-mem-update-jclip.xqy";

(:: Namespace Declarations ::)
declare namespace p = "urn:us:gov:ic:pubs";
declare namespace ism = "urn:us:gov:ic:ism";

(:: Variable Declarations ::)
declare variable $crosswalk:organization-entities := "";
declare variable $crosswalk:add-copyright := false();
declare variable $crosswalk:copyright := "";

(:~
 : Performs the element mapping necessary to create a DDMS document
 :
 : @param $data-source - String representation of the datasource name
 : @param $bin-uri - URI to the document binary
 : @param $doc - Document node
 :
 : @return - Fully mapped DDMS V2 Document
:)
declare function crosswalk:crosswalk($data-source as xs:string, $bin-uri as xs:string, $doc as node()) {
	(: Map for ddms :)
	let $map := map:map()
	(: Perform content crosswalk :)
	let $map := crosswalk:create-ddms($doc, $map)
	(: Perform manual entity tagging :)
	let $put := crosswalk:create-entities($doc)
	(: Perform extra content crosswalk :)
	let $map := crosswalk:create-extra-content($data-source, $doc, $map)
	(: Add non-content items :)
	let $put := (
		map:put($map, $dcgs-ddms:subjectLabel, "COLLECTION"),
		map:put($map, $dcgs-ddms:uri, $bin-uri),
		map:put($map, "data-source", $data-source),
		map:put($map, $dcgs-ddms:source, $data-source),
		map:put($map, $dcgs-ddms:mimetype, "text/xml"),
		map:put($map, $dcgs-ddms:medium, "text"),
		map:put($map, $dcgs-ddms:binarysize, fn:string-length(xdmp:quote($doc)))
	)
	(: Build DDMS :)
	return dcgs-ddms:build-ddms2($map)
};

(:~
 : Maps document elements to DDMS elements and inserts them into a map
 :
 : @param $doc - Document as a node
 : @param $map - Map to populate with mapped values 
 :
 : @return - Populated map
:)
declare private function crosswalk:create-ddms($doc, $map) {
	let $_ := xdmp:log(xdmp:describe($doc), "debug")
	(:: Single value DDMS items ::)
	let $singles := (
		(: General :)
		crosswalk:map-property($map, $dcgs-ddms:identifier, $doc//p:DocumentID/text()),
		crosswalk:map-property($map, $dcgs-ddms:title, $doc//p:Title/text()),
		crosswalk:map-property($map, $dcgs-ddms:description, $doc//p:Description/text()),
		crosswalk:map-property($map, $dcgs-ddms:privacyAct, $doc//p:PrivacyActIndicator/@indicator),
		crosswalk:map-property($map, $dcgs-ddms:copyright, $doc//p:CopyrightIndicator/@indicator),
		crosswalk:map-property($map, $dcgs-ddms:publisher, $doc//p:AgencyAcronym/@acronym),
		crosswalk:map-property($map, $dcgs-ddms:pointofcontact, $doc//p:POCinfo/p:OfficeName/text()),
		crosswalk:map-property($map, $dcgs-ddms:source, $doc//p:OtherProperty[@qualifier eq "TAC.source"]/text()),
		crosswalk:map-property($map, $dcgs-ddms:language, $doc//p:Language/text()),
		crosswalk:map-property($map, $dcgs-ddms:languageQualifier, $doc//p:Language/@encoding),
		crosswalk:map-property($map, $dcgs-ddms:subjectKeyword, $doc//p:Subject/p:Keyword/text()),
		crosswalk:map-property($map, $dcgs-ddms:overall-classification, dcgs-ds:get-classification($doc//p:OtherProperty[@qualifier eq "IL.secur.classif"]/text())),
		crosswalk:map-property($map, $dcgs-ddms:overall-ownerProducer, $doc//p:OtherProperty[@qualifier eq "IL.secur.ownerproducer"]/text()),

		(: Temporal :)
		crosswalk:map-property($map, $dcgs-ddms:datePosted, $doc//p:DatePosted/text()),
		crosswalk:map-property($map, $dcgs-ddms:dateCreated, crosswalk:parse-date-only($doc//p:IntelDoc/@ism:createDate))
	)

	(:: Content ::)
	let $_ :=	map:put($map, $dcgs-ddms:extracted-content, crosswalk:create-extracted-content($doc))
	(:let $extracted-content := crosswalk:create-extracted-content($doc)
	let $put := crosswalk:map-property($map, $dcgs-ddms:extracted-content, $extracted-content):)

	return $map
	};


(:~ 
 : Add non-empty values to the map
 :
 : @param $map - Map to populate
 : @param $prop - The property name
 : @param $value - Value for the property
 :
 : return void
:)
declare private function crosswalk:map-property($map, $prop as xs:string, $value) {
  if (fn:string-length($prop) > 0 and fn:not(fn:empty($value)) and fn:string-length(text{$value}) > 0) then
    (map:put($map, $prop, text{$value}),xdmp:log(fn:concat("Prop:",$prop," Value:",text{$value}), "debug"))
  else
    xdmp:log(fn:concat("Prop:",$prop," Value: EMPTY!"), "debug")
};

(:~
 : Creates the extracted content from the document
 :
 : @param $doc - The document
 :
 : @return Extracted content section from body of document
:)
declare private function crosswalk:create-extracted-content($doc as node()+) {
  let $seq := (
    for $p in $doc//p:Para
      let $text := $p/text()
      let $hasCopyright := 
      	if(fn:contains($text, "Copyright (C)")) then
      		  (xdmp:set($crosswalk:add-copyright, true()),
      		  xdmp:set($crosswalk:copyright, $text))
      	else ()
      let $classification := fn:concat("(",$p/@ism:classification,") ")
      let $p := element {"p"} {fn:concat($classification, $text)}
      return $p
   )
   return mem:node-replace($doc//p:DocumentBody, element p:DocumentBody {
     attribute ism:classification { $doc//p:DocumentBody/@ism:classification },
     attribute ism:ownerProducer { $doc//p:DocumentBody/@ism:ownerProducer },
     $seq})//p:DocumentBody
};

(:~
 : Inspects the document and determines the datasource
 :
 : @param $doc - XML document as node
 :
 : @return string value of data source name
:)
declare function crosswalk:get-data-source($doc) {
	let $src := $doc//p:OtherProperty[@qualifier eq "TAC.feed"]/text()
	return
		fn:upper-case($src)
};

(:~
 : Parse date with no time information 
 :
 : @param text - Textual representation of a data
 :
 : @return Valid DDMS v2 formatted date value
:)
declare private function crosswalk:parse-date-only($text) {
	if (fn:string-length($text) gt 0) then
		xdmp:parse-dateTime("[Y0001]-[M01]-[D01]",$text)
	else ()
};

(:~ 
 : Perform manual entity creation 
 :
 : @param $doc - Reference to document
 :
 : @return Extracted Entity 
:)
declare private function crosswalk:create-entities($doc) { 
	(: Organizations :)
	let $local-organization-entities := 
		for $organization in ($doc//p:AgencyAcronym/@acronym)
		return
	        <e:entity-organization-other xmlns:e='http://marklogic.com/entity'>
	          <e:val organization="{$organization}" name="{$organization}" xmlns:e='http://marklogic.com/entity' >{$organization}</e:val>
	        </e:entity-organization-other>	        

	return (xdmp:set($crosswalk:organization-entities,$local-organization-entities))
};

(:~ 
 : Perform extra content crosswalk
 :
 : @param $datasource - Name of datasource 
 : @param $doc - The document
 : @param $map - An existing map to populate with new values
 :
 : @return $map
:)
declare function crosswalk:create-extra-content($datasource, $doc, $map) {
	(: Build Extra Content :)
	let $extracontent :=
	<div class='{$datasource}'>
	{
		if(fn:not(fn:empty($crosswalk:organization-entities))) then
			<div class='Organizations'>{$crosswalk:organization-entities}</div>
		else(),

		(: Copyright :)
		if($crosswalk:add-copyright) then
	    	crosswalk:extra-content("CopyrightNotice", $crosswalk:copyright)
	    else()
	}
	</div>

	(: Put extra content in Map :)
	let $put := map:put($map, $dcgs-ddms:extra-content, $extracontent)

	return $map
};

(:~
 : Add non-empty extra content
 :
 : @param $prop - Name of property to add
 : @param $value - Value to associate to the property
 :
 : @return Html node for extra content section
:)
declare function crosswalk:extra-content($prop as xs:string, $value) {
	for $node in $value
		return
			if(fn:exists($node)) then
				<div class='{$prop}'>{$node}</div>
			else ()
};