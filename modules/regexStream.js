var regexp = require("node-regexp");


	RegExStream : function(patternIn) {

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
;