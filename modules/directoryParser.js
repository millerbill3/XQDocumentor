var path = require("path"),
    stringUtil = require("string"),
    util = require("util"),
    EventEmitter = require("events").EventEmitter,
    walker = require("filewalker");


function Walker(){
    if(false === (this instanceof Walker)) {
        return new Walker();
    }
    EventEmitter.call(this);
}

util.inherits(Walker, EventEmitter);

Walker.prototype.walk = function(dir, exclusionDirs, done) {
    var files_to_return = [];
    var walkerEmitter = this;
    console.log();
    console.log("***************************************");
    console.log("********* Scanning Directories ********");
    console.log("***************************************");
    console.log();
    walker(dir)
        .on('dir', function(p) {
        })
        .on('file', function(p, s, absPath) {
            if (!processExclusionDirectory(exclusionDirs, absPath) && stringUtil(p).endsWith(".xqy")) {
                files_to_return.push(absPath);
            }
        })
        .on('error', function(err) {
            console.error(err);
        })
        .on('done', function() {
            walkerEmitter.emit("DoneWalking", files_to_return);
        })
        .walk();
};


var processExclusionDirectory = function (dirs, path) {
    var found = false;
    dirs.forEach(function (filePath) {
        if (stringUtil(path).contains(filePath.trim())) {
            found = true;
            return;
        }
    });
    return found;
};
module.exports = Walker;




