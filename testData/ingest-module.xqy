xquery version "1.0-ml";
(:~ Copyright 2014, MarkLogic Corporation. All Rights Reserved. 
 : This module is responsible for handling the ingestion logic
 : for processing COMTEX/BBCMON data sources
 :
 : @author Bill Miller, MarkLogic Corporation
 : @version 1.0
:)

import module namespace ds = "http://marklogic.com/sof/data-source" at "/data-sources/lib/data-source.xqy";
import module namespace edl = "http://marklogic.com/edl" at "/data-sources/lib/sdl.xqy";
import module namespace dcgs-ddms = "http://marklogic.com/ps/dcgs-ddms" at "/data-sources/lib/dcgs-ddms2.xqy";
import module namespace crosswalk = "http://marklogic.com/sof/data-sources/comtex_bbcmon/crosswalk" at "/data-sources/comtex_bbcmon/crosswalk.xqy";
import module namespace functx     = "http://www.functx.com" at "/MarkLogic/functx/functx-1.0-nodoc-2007-01.xqy";

(: Declarations :)
declare namespace p = "urn:us:gov:ic:pubs";
declare namespace ddms  = "http://metadata.dod.mil/mdr/ns/DDMS/2.0/";
declare option xdmp:mapping "false";

(: External params :)
declare variable $meta-uri as xs:string external;
declare variable $bin-uri as xs:string external;
declare variable $map as map:map external;
declare variable $bin as node() external;

(: Build DDMS :)
let $doc := map:get($map, $dcgs-ddms:extracted-content)
let $data-source := crosswalk:get-data-source($doc)
let $collection-version := fn:concat($data-source, "-v1")
let $ddms := crosswalk:crosswalk($data-source, $bin-uri, $doc)
let $publisher := $doc//p:AgencyAcronym/@acronym
let $creator := $doc//p:OtherProperty[@qualifier eq "TAC.source"]

(: Build EDL :)
let $edl := edl:resource($meta-uri, $data-source, $publisher, $creator, $bin-uri, $ddms, $map)

(: Add collection id for metadata to allow for possible independent processing of distinct versions :)  
let $md-collections := ( $collection-version, edl:default-metadata-collections() ) 

let $write_md_and_bin := (
  edl:write-metadata($meta-uri, $edl, $md-collections), (: Write the Metadata doc :)
  ds:write-binary($bin-uri, $bin, $collection-version) (: Write the binary doc :)
)

(: Log insertion :)
return (xdmp:log(fn:concat("Inserting: ", $meta-uri), "debug"), fn:true())