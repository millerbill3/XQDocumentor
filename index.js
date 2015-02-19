var dirParser = require("./modules/directoryParser"),
  fs = require("fs"),
  ripper = require("./modules/xqdocs_parser"),
    rs = require("./modules/regexStream");

if (process.argv.length == 2) {
  throw "Error, no arugments provided!";
} else {

  var arguments = process.argv.slice(2)
  var scanDir = arguments[0];
  var exclusionDirectories = [];

  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      exclusionDirectories.push(arguments[i]);
    }
  }

  var filesToProcess = [];
  dirParser.walk(scanDir, exclusionDirectories, function(err, results) {
    if (err)
      throw err;
    ripper.rip(results, 'utf8');
  });
  
}