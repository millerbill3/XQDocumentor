# XQDocumentor
A Node JS application for creating Xquery Documentation (similar to Java Docs) based on the xqDocs specification.

<c>**THIS PROJECT IS A BETA VERSION**</c>

NOTE: This project is not yet "Bullet Proof". Work still has to be done to ensure all module declarations are properly captured. Please feel free to provide feedback as work on this project is a continuing effort.

This project is a node js module capable of traversing a provided directory, scanning all .xqy files, parsing all the valid xqdocs formatted documentation and generating html documentation files. In order to ensure your module documentation is correctly capture, please ensure it conforms to the [xqDocs](http://xqdoc.org/index.html) specification.

To get started, download this package and ensure you have [Node.js](https://nodejs.org/) installed locally. All required libraries will be include with the download. From the command prompt / terminal window, navigate the directory where you downloaded this package and enter the command:
```
node index
```

The application will prompt you step-by-step to provide the required information to start processing your xqy files.
  1. Provide path to directory containing your source files (.xqy)
    * Note: Currently, only ".xqy" files are recognized
  2. If applicable, provide any sub-directories you wish to exclude from evaluation
  3. Provide a directory where generated output files used for extracted content should be placed. Defaults to *./output*
     * NOTE!!! The directory specified will have all content removed during processing to ensure only current/updated content is listed after processing. Please choose wisely.

Once processing is complete, the web server will be started and listening on port 3000. You may view the generated output by going to *http://localhost:3000* in your web browser. The page presented will list all the files that were parsed and have documentation generated with a link to each file.

##Future Enhancements
* Improved Comment/Documentation recognition
* Improved HTML formatting
* Include links to internally referenced variables within document
* Include links to externally referenced variables
* Links to external modules that reference module functions
* View to actual code block being referenced
* Make default http port configurable.
* Validate file paths are cross-platform compatible.
