var fs = require("fs"),
    path = require("path"),
    util = require("util"),
    docObj = require("./document"),
    utils = require("./utils"),
    EventEmitter = require("events").EventEmitter,
    Transform = require("stream").Transform;


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
        ModuleDescription : utils.getModuleDescription(data),
        ModuleNamespace :utils.getModuleNamespaceDeclaration(data),
        AllMethods : utils.getAllMethods(data)
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
    doc.ModuleNamespace = data.ModuleNamespace;

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

    doc.UndocumentedMethods = utils.getUndocumentedMethods(data.AllMethods,doc.DocumentedMethods);
    this.push(JSON.stringify(doc));
    process();
}
//==================================
function Ripper(){
    if(false === (this instanceof Ripper)) {
        return new Ripper();
    }
    EventEmitter.call(this);
}
util.inherits(Ripper, EventEmitter);

Ripper.prototype.rip = function(files, output_directory) {
    var fileName = path.basename(files[working]);
    var ripEmitter = this;
    var unique = 0;
    var working = 0;
    var list = [];

    var readFun = function(file)
    {
        fileName = path.basename(file);

        var outputfileData = {};
        outputfileData["filePath"] = path.dirname(file);
        outputfileData["fileName"] = fileName;
            outputfileData["jsonPath"] = output_directory.concat("/", fileName.toLowerCase(), unique, ".json");
        list.push(outputfileData);

        console.log("-- Processing: " + fileName);
        var rs = fs.createReadStream(file, {encoding: 'utf8'});
        var ws = fs.createWriteStream(output_directory.concat("/", fileName.toLowerCase(), unique, ".json"));
        unique++;
        rs.pipe(new RegexStream())
            .pipe(new DocumentObjectStream(file))
            .pipe(ws)
            .on('finish', function () {
                //no-op
            });
        rs.on('data', function(){
            working++;
        });
        rs.on('end', function(){
            //no-op
        });
        rs.on('close', function(){
            if(files[working] != null){
                unique++;
                readFun(files[working]);
            }else{
                ripEmitter.emit("DoneProcessing", list);
            }
        });
    } 
    readFun(files[0]);  
};

module.exports = Ripper;
