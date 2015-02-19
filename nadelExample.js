// Include module references.
var through2 = require( "through2" );
var chalk = require( "chalk" );


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// I am a Transform stream (writable/readable) that takes input and finds matches to the
// given regular expression. As each match is found, I push each match onto the output
// stream individually.
function RegExStream( patternIn ) {

	// Make sure the pattern is an actual instance of the RegExp object and not just a
	// string. This way, we can treat it uniformly later on.
	if ( ! ( patternIn instanceof RegExp ) ) {

		patternIn = new RegExp( patternIn, "g" );

	}

	// Since the patter is passed-in by reference, we need to create a clone of it
	// locally. We're doing to be changing the RegExp properties and we need to make
	// sure we're not breaking encapsulation by letting the calling scope alter it.
	var pattern = clonePattern( patternIn );

	// I hold the unprocessed portion of the input stream.
	var inputBuffer = "";

	// Return the Transform stream wrapper. We're using the "obj" convenience method
	// since we want out read stream to operate in object mode - this way, each read()
	// invocation will constitute a single pattern match.
	return( through2.obj( transform, flush ) );


	// ---
	// PRIVATE METHODS.
	// ---


	// I clone the given regular expression instance, ensuring a unique reference that
	// is also set to include the "g" (global) flag.
	function clonePattern( pattern ) {

		// Split the pattern into the pattern and the flags.
		var parts = pattern.toString().slice( 1 ).split( "/" );
		var regex = parts[ 0 ];
		var flags = ( parts[ 1 ] || "g" );

		// Make sure the pattern uses the global flag so our exec() will run as expected.
		if ( flags.indexOf( "g" ) === -1 ) {

			flags += "g";

		}

		return( new RegExp( regex, flags ) );

	}


	// Since we are no longer using Prototype methods, we're creating functions that
	// are bound to instances of the RegExStream. As such, we should probably clean
	// up variable references to help the garbage collector, especially since we're
	// also passing those methods "out of scope."
	// --
	// CAUTION: I'm not entirely sure this is necessary in NodeJS. In JavaScript on the
	// browser, the worst-case is that the user refreshes their page. But, when running
	// JavaScript on the server, we might need to be more vigilant about this stuff.
	function destroy() {

		patternIn = pattern = inputBuffer = clonePattern = destroy = flush = transform = null;

	}


	// I finalize the internal state when the write stream has finished writing. This gives
	// us one more opportunity to transform data and push values onto the output stream.
	function flush( flushCompleted ) {

		logInput( "@flush - buffer:", inputBuffer );

		var match = null;

		// Loop over any remaining matches in the internal buffer.
		while ( ( match = pattern.exec( inputBuffer ) ) !== null ) {

			logInput( "Push( _flush ):", match[ 0 ] );

			this.push( match[ 0 ] );

		}

		// Clean up the internal buffer (for memory management).
		inputBuffer = "";

		// Signal the end of the output stream.
		this.push( null );

		// Signal that the input has been fully processed.
		flushCompleted();

		// Tear down the variables to help garbage collection.
		destroy();

	}


	// I transform the given input chunk into zero or more output chunks.
	function transform( chunk, encoding, getNextChunk ) {

		logInput( ">>> Chunk:", chunk.toString( "utf8" ) );

		// Add the chunk to the internal buffer. Since we might be matching values across
		// multiple chunks, we need to build up the buffer with each unused chunk.
		inputBuffer += chunk.toString( "utf8" );

		// Since we don't want to keep building a large internal buffer, we want to pair-
		// down the content that we no longer need. As such, we're going to keep track of
		// the the position of the last relevant index so that we can drop any portion of
		// the content that will not be needed in the next chunk-processing.
		var nextOffset = null;

		var match = null;

		// Loop over the matches on the buffered input.
		while ( ( match = pattern.exec( inputBuffer ) ) !== null ) {

			// If the current match is within the bounds (exclusive) of the input
			// buffer, then we know we haven't matched a partial input. As such, we can
			// safely push the match into the output.
			if ( pattern.lastIndex < inputBuffer.length ) {

				logInput( "Push:", match[ 0 ] );

				this.push( match[ 0 ] );

				// The next relevant offset will be after this match.
				nextOffset = pattern.lastIndex;

			// If the current match butts up against the end of the input buffer, we are
			// in danger of an invalid match - a match that will actually span across two
			// (or more) successive _write() actions. As such, we can't use it until the
			// next write (or finish) event.
			} else {

				logInput( "Need to defer '" + match[ 0 ] + "' since its at end of the chunk." );

				// The next relevant offset will be BEFORE this match (since we haven't
				// transformed it yet).
				nextOffset = match.index;

			}

		}

		// If we have successfully consumed a portion of the input, we need to reduce
		// the current input buffer to be only the unused portion.
		if ( nextOffset !== null ) {

			inputBuffer = inputBuffer.slice( nextOffset );

		// If no match was found at all, then we can reset the internal buffer entirely.
		// We know we won't need to be matching across chunks.
		} else {

			inputBuffer = "";

		}

		// Reset the regular expression so that it can pick up at the start of the
		// internal buffer when the next chunk is ready to be processed.
		pattern.lastIndex = 0;

		// Tell the source that we've fully processed this chunk.
		getNextChunk();

	}

}


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// Create our regex pattern matching stream.
var regexStream = new RegExStream( /\w+/i );

// Read matches from the stream.
regexStream.on(
	"readable",
	function() {

		var content = null;

		// Since the RegExStream operates on "object mode", we know that we'll get a
		// single match with each .read() call.
		while ( content = this.read() ) {

			logOutput( "Pattern match: " + content.toString( "utf8" ) );

		}

	}
);

// Write input to the stream. I am writing the input in very small chunks so that we
// can't rely on the fact that the entire content will be available on the first (or
// any single) transform function.
"How funky is your chicken? How loose is your goose?".match( /.{1,3}/gi )
	.forEach(
		function( chunk ) {

			regexStream.write( chunk, "utf8" );

		}
	);

// Close the write-portion of the stream to make sure the last write() gets flushed.
regexStream.end();


// ---------------------------------------------------------- //
// ---------------------------------------------------------- //


// I log the given input values with a distinct color.
function logInput() {

	var chalkedArguments = Array.prototype.slice.call( arguments ).map(
		function( value ) {

			return( chalk.cyan( value ) );

		}
	);

	console.log.apply( console, chalkedArguments );

}


// I log the given output values with a distinct color.
function logOutput() {

	var chalkedArguments = Array.prototype.slice.call( arguments ).map(
		function( value ) {

			return( chalk.bgCyan.white( value ) );

		}
	);

	console.log.apply( console, chalkedArguments );

}