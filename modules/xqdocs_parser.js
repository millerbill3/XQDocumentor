var fs = require("fs"),
    path = require("path"),
    stream = require("stream"),
    util = require("util"),
    docObj = require("./document"),
    utils = require("./utils"),
    Transform = require("stream").Transform;

var unique = 0;
module.exports = {
    rip: function (file, output_directory) {
        console.log("Processing: " + file );
        var indexOfFiles = [];
        var fileName = path.basename(file);
        var rs = fs.createReadStream(file, {encoding: 'utf8'});
        var ws = fs.createWriteStream(output_directory.concat("/", fileName, unique, ".json"));
        unique++;
        rs.pipe(new RegexStream())
            .pipe(new DocumentObjectStream(file))
            .pipe(ws)
            .on('finish', function () {
                indexOfFiles.push(fileName);
            });
    }
};

//*****************************************************************************
util.inherits(RegexStream, Transform);
function RegexStream() {
    if (!(this instanceof RegexStream)) {
        return new RegexStream();
    }
    Transform.call(this, {"objectMode": true});
}
RegexStream.prototype._transform = function (data, encoding, process) {
    var retObj = {
        docComments: utils.extractDocumentationFromDoc(data),
        docVars: utils.getModuleVariables(data),
        docImports: utils.getModuleImports(data),
        NamespaceDeclarations: utils.getNamespaceDeclarations(data),
        Imports: utils.getModuleImports(data),
        ModuleDescription : utils.getModuleDescription(data)
    }
    this.push(retObj)
    process();
}

//*****************************************************************************
// Create Document Object from extracted content
util.inherits(DocumentObjectStream, Transform);
function DocumentObjectStream(fName) {
    var FName = path.basename(fName);
    if (!(this instanceof DocumentObjectStream))
        return new DocumentObjectStream(FName);
    this.fileName = FName;
    this.filePath = fName;
    Transform.call(this, {"objectMode": true});
}
DocumentObjectStream.prototype._transform = function (data, encoding, process) {
    var doc = new docObj.Document(this.fileName);
    doc.FileSystemPath = this.filePath;
    doc.Variables = data.docVars;
    doc.NameSpaceDeclarations = data.NamespaceDeclarations;
    doc.Imports = data.Imports;
    doc.ModuleDescription = data.ModuleDescription;

    data.docComments.forEach(function (comment) {
        var method = new docObj.Method();
        var methodDescriptor = utils.getMethodFromComment(comment);
        var methodParams = utils.getMethodParameters(comment);
        if (methodParams)
            methodParams.forEach(function (param) {
                var p = new docObj.Param();
                p.name = param["param"];
                p.description = param["description"];
                method.params.push(p);
            })
        method.comment = utils.getMethodComment(comment);
        method.accessor = methodDescriptor[1] === "" ? "public" : methodDescriptor[1];
        method.methodName = methodDescriptor[2];
        method.returns = utils.getMethodReturn(comment);

        doc.DocumentedMethods.push(method);

    });

    this.push(JSON.stringify(doc));
    process();
}


