module.exports = {
	extractDocumentationFromDoc : function(document){
		var regex = new RegExp("(\\(:~\\s*:\\s*[\\w\\s:@$-]*:\\)\\s*declare\\s+(?:private\\s)?function[\\s\\w]+:\\w+[\\(\\$\\w\\-\\_\\s:,\\+\\*\\(\\)]+\\)+)", "igm");
		if(regex.test(document))
			return document.match(regex);
		else return [];
	},
	extractDocumentedMethods : function(rawComment){
		var documentedMethods = [];
				this.comments.forEach(function(item){
					documentedMethods.push(methodMatcher(item))
				});
		return documentedMethods
	},
	getMethodFromComment : function(comment){
		var regex = new RegExp("declare\\s+((?:private\\s+)?)function\\s+([\\w\\-]*:[\\w\\-\\_]*)[\\(\\$\\w\\-\\_\\s:,\\+\\*\\(\\)]+\\)+","i")
		return comment.match(regex);
	},
	getMethodComment : function(comment){
		var regex = new RegExp("(?:\\(:~\\s*:\\s*)([\\w\\s$\\-:]*)", "i");
		var matches = regex.exec( comment );
		if(matches)
			return matches[1].replace(new RegExp("[:\\n\\s]+","gm"), " ").trim()
		return ""
	},
	getModuleVariables : function(code){
		var regex = new RegExp("^(?:\\(\\:~[\\:\\s\\w]*\\)\\s)?(?:declare|define)(?:\\s+variable\\s+)(\\$[\\w\\:\\-]+)", "igm");
		var varsArray = [];

		if(regex.test(code)){//TODO - Finish writing regex to return variable description if one exists
			regex = new RegExp("^(?:\\(\\:~[\\:\\s\\w]*\\)\\s)?(?:declare|define)(?:\\s+variable\\s+)(\\$[\\w\\:\\-]+)", "igm");
			while (matches = regex.exec( code )){
				var variableObj = {};
				if(matches[0].startsWith("(:~")) {
					var cmtRegEx = new RegExp("^(\\(\\:~[\\:\\s\\w]*\\)\\s)", "gm");//Retrieves the comment above variable
					var cmt = matches[0].match(cmtRegEx);

					var cmtReplRegEx = new RegExp("^([\\(\\:~\\s\\)]*)", "gm");//Removes special comment characters
					variableObj["comment"] = cmt[0].replace(cmtReplRegEx, "").replace("\n", " ");
				} else {
					variableObj["comment"] = null;
				}
				variableObj["variable"] = matches[1];
				varsArray.push(variableObj);
			}
		}
		return varsArray
	},
	getMethodParameters : function(comment){
		var regex = new RegExp("(?:\\@param\\s+)(\\$[\\w\\-]*)[\\s\\-]*([\\s\\w]*)", "ig");
		var paramsArray = [];
		//console.log(regex.exec( comment ))
		while (matches = regex.exec( comment )){
			var params = {};
 			params["param"] = matches[1];
 			params["description"] = matches[2].replace(new RegExp("\\n"), "").trim();
 			paramsArray.push(params);
		}
		return paramsArray;
	},
	getMethodReturn : function(comment){
		var regex = new RegExp("(?:\\@return\\s+\\-*)([\\w\\$\\s-\\.\\*\\(\\)#@!%&+\\?\\'\\\"]*)", "i");
		var matches = regex.exec( comment );
		var ret = "** UNDOCUMENTED **"
		if(matches && matches.length > 0){
			var i=0;
			matches.forEach(function(match){
				i++
				if(i % 2 === 0){
					ret = match.trim();
				}
			})
		}
		return ret
	},
	getModuleImports : function(code){
		var regex = new RegExp("(?:import\\s+module\\s+namespace\\s+)([\\w\\-]+)(?:[\\s=\\\"]*)(http:\\/\\/[\\w.\\/\\-]+)(?:\\\"\\s+at\\s+\\\")([\\w\\/\\-.]+)", "ig");
		var ret = [];
		if(regex.test(code)){
			var regex2 = new RegExp("(?:import\\s+module\\s+namespace\\s+)([\\w\\-]+)(?:[\\s=\\\"]*)(http:\\/\\/[\\w.\\/\\-]+)(?:\\\"\\s+at\\s+\\\")([\\w\\/\\-.]+)", "ig")
			while (matches = regex2.exec( code )){
				var retObj = {};
				retObj["namespace"] = matches[1] == null ? "" : matches[1];
				retObj["urn"] = matches[2] == null ? "" : matches[2];
				retObj["location"] = matches[3] == null ? "" : matches[3];
				ret.push(retObj);
			}
			return ret;
		}
	},
	getNamespaceDeclarations : function(code){
		var regex = new RegExp("(?:declare\\s+namespace\\s+)(\\w+)(?:\\s*=\\s*\\\")([\\/\\.\\w\\:\\\"]*)", "ig");
		var ret = [];
		if(regex.test(code)){
			var regex2 = new RegExp("(?:declare\\s+namespace\\s+)(\\w+)(?:\\s*=\\s*\\\")([\\/\\.\\w\\:\\\"]*)", "ig");
			while(match = regex2.exec(code)){
				var retObj = {};
				retObj["namespace"] = match[1];
				retObj["urn"] = match[2];
				ret.push(retObj);
			}
		}
		return ret;
	},
	getModuleDescription : function(code){
		var retObj = {};
		var regex = new RegExp("^(?:\\(:~)([\\s:\\w\\.\\,\\/\\'\\@]+)(?:\\)\\s+module\\s+namespace\\s+crosswalk)", "im");
		if(regex.test(code))
		{
			var regex2 = new RegExp("^(?:\\(:~)([\\s:\\w\\.\\,\\/\\'\\@]+)(?:\\)\\s+module\\s+namespace\\s+crosswalk)", "im");
			var modDesc = regex2.exec(code)[0];

			var repRegEx = new RegExp("^([\\(\\:~\\s\\)]*)", "gm");//remove
			var repRegEx2 = new RegExp("([\\s]*(@author|@see|@version|@since)[\\w\\s\\.\\,\\n\\:\\)=\"\\/\\-\\;]*)", "gm");
			var desc = modDesc.replace(repRegEx, "");
			var desc = desc.replace(repRegEx2, "");

			retObj["modDesc"] = desc.length ? desc : "";

			//Get Author Value
			var authorRegEx = new RegExp("(@author)([\\s\\w\\,\\'\\=\\:]+)","im");
			retObj["author"] = authorRegEx.test(modDesc) ? authorRegEx.exec(modDesc)[2].replace("\n", "").replace(":","") : "";

			//Get Version Value
			var versionRegEx = new RegExp("(@version)([\\s\\w\\,\\'\\=\\:]+)","im");
			retObj["version"] = versionRegEx.test(modDesc) ? versionRegEx.exec(modDesc)[2].replace("\n", "").replace(":","") : "";

			//Get Since Value
			var sinceRegEx = new RegExp("(@since)([\\s\\w\\,\\'\\=\\:]+)","im");
			retObj["since"] = sinceRegEx.test(modDesc) ? sinceRegEx.exec(modDesc)[2].replace("\n", "").replace(":","") : "";

			//Get See Value
			var seeRegEx = new RegExp("(@see)([\\s\\w\\,\\'\\=\\:]+)","im");
			retObj["see"] = seeRegEx.test(modDesc) ? seeRegEx.exec(modDesc)[2].replace("\n", "").replace(":","") : "";

			//Get Module Namespace
			var namespaceRegEx = new RegExp("(?:module\\s+namespace\\s+)([\\w\\_\\-]+)(?:[\\s\\=\\\"]*)([\\w\\s\\:\\/\\.\\-\\\"]+)","im");
			if(namespaceRegEx.test(code)){
				var namespaceObj = {};
				namespaceObj["name"] = namespaceRegEx.exec(code)[1];
				namespaceObj["uri"] = namespaceRegEx.exec(code)[2];
				retObj["namespace"] = namespaceRegEx.test(code) ? namespaceObj : "";
			}

			//console.log(retObj);
		}
		return retObj;
	}
};
String.prototype.startsWith = function(prefix) {
	return this.indexOf(prefix) === 0;
}