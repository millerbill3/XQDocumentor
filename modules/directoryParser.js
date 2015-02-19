var fs = require("fs"),
  path = require("path"),
  s = require("string");

module.exports = {
  walk: function(dir, exclusionDirs, done) {
    return walk(dir, exclusionDirs, done);
  }
}

/**
Recursively traverses the specified directory and
excludes 
**/
var walk = function(dir, exclusionDirs, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err)
      return done(err);
    var pending = list.length;

    if (!pending)
      return done(null, results);

    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory() && !processExclusionDirectory(exclusionDirs,dir)) {
          walk(file, exclusionDirs, function(err, res) {
            results = results.concat(res);
            if (!--pending)
              done(null, results);
          });
        } else {
          if (s(file).endsWith(".xqy"))
            results.push(file);
          if (!--pending)
            done(null, results);
        }
      });
    });
  });
  return results;
}

var processExclusionDirectory = function(dirs, path)
{
  var found = false;
  dirs.forEach(function(filePath){
    if(s(path).contains(filePath)){
      found = true;
      return;
    }
  });
  console.log(found)
  return found;
}





