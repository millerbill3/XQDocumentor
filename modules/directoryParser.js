var fs = require("fs"),
    path = require("path"),
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
            //console.log('dir:  %s', p);
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
            //console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
            walkerEmitter.emit("DoneWalking", files_to_return);
        })
        .walk();


};


var processExclusionDirectory = function (dirs, path) {
    var found = false;
    dirs.forEach(function (filePath) {
        if (stringUtil(path).contains(filePath)) {
            found = true;
            return;
        }
    });
    //console.log(found)
    return found;
};
module.exports = Walker;




