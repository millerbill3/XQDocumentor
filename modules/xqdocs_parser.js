var fs = require("fs"),
		path = require("path"),
  		regexp = require("node-regexp");

module.exports = {
	rip : function(files, enc){
		var regexStream = new rs.RegExStream( /\w+/i );

		// Read matches from the stream.
		regexStream.on(
			"readable",
			function() {

				var content = null;

				// Since the RegExStream operates on "object mode", we know that we'll get a
				// single match with each .read() call.
				while ( content = this.read() ) {

					logOutput( "Pattern match: " + content.toString( enc ) );

				}

			}
		);

		fs.createReadStream('./testData/crosswalk.xqy')
		.pipe(function (chunk, enc, callback) {
			// Write input to the stream. I am writing the input in very small chunks so that we
			// can't rely on the fact that the entire content will be available on the first (or
			// any single) transform function.
			chunk.match( /.{1,3}/gi )
				.forEach(
					function( chunk ) {
						console.log(chunk, enc)
						//regexStream.write( chunk, "utf8" );

					}
				);
			callback();
		});

		

		// Close the write-portion of the stream to make sure the last write() gets flushed.
		regexStream.end();
				
		// fs.createReadStream('./testData/crosswalk.xqy')
		// .pipe(through2.obj(function (chunk, enc, callback) {
		// 	this.push(chunk)

		// 	callback()
		// }))

		// .on('data', commentMatcher)

		// .on('end', function () {
		// 	//consoleOutput(all)
		// })
	}
};
var consoleOutput = function(data)
{
	console.log(data.toString('utf8'));
}

var commentMatcher = function(data)
{
	console.log(data.toString('utf8'));
	//regex to match comment and associated function definition
	//^(\(:~\n[\s]+:[\w\s:\@\$-]+:\))[\n\s]+(declare\s+[\w\s]*:[\w\s-_]*\([\$\w-\s:,\(\)]*)
}