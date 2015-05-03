module.exports = {
	Document : function(filename){
		this.FileName = filename;
		this.DocumentedMethods = [];
		this.UndocumentedMethods = [];
		this.Variables = [];
		this.ModuleDescription = "";
		this.ModuleNamespace = "";
		this.Imports = [];
		this.NameSpaceDeclarations = [];
		this.FileSystemPath = "";
		return this;
	},
	Method : function(){
		this.methodName = "";
		this.accessor = "";
		this.params = [];
		this.comment = "";
		this.returns = ""
		return this;
	},
	Param : function(){
		this.name = "";
		this.type = "";
		this.modularity = "";
		this.description = "";
		return this;
	},
	Import : function(){
		this.variable = "";
		this.namespace = "";
		this.location = "";
	}
};
