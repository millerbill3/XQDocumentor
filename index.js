var dirParser = require("./modules/directoryParser"),
    inquirer = require("inquirer"),
    path = require("path"),
    fs = require("fs"),
    parser = require("./modules/xqdocs_parser"),
    http = require("http"),
    server = require("./modules/server");

global.appRoot = path.resolve(__dirname);

var questions = [
    {
        type: "input",
        name: "dir_to_inspect",
        message: "Provide directory containing your xquery files to process:",
        default: "./testData",
        validate: function (dir) {
            try {
                fs.statSync(dir).isDirectory()
            }
            catch (er) {
                return "Directory provided does not exist."
            }
            return true;
        }
    },
    {
        type: "confirm",
        name: "has_exclusion_directory",
        message: "Is there any directory within the one provided that should be excluded from processing",
        default: false
    },
    {
        type: "input",
        name: "dirs_to_exclude",
        default: [],
        message: "Provide one or more directies to exdlude from processing (comma separated):",
        when: function (answers) {
            return answers["has_exclusion_directory"]
        },
        validate: function (dir) {
            var directories = dir.split(',')
            directories.forEach(function (dir) {
                try {
                    fs.statSync(dir).isDirectory()
                }
                catch (er) {
                    return "Directory '" + dir + "'' provided does not exist."
                }
            })
            return true;
        },
        filter: function (val) {
            return val.split(',')
        }
    },
    {
        type: "input",
        name: "output_directory",
        message: "Provide directory where output files should go:",
        default: "./output"
    }
];


inquirer.prompt(questions,
    function (answers) {
        var exclusionDirectories = answers["has_exclusion_directory"] ? answers["dirs_to_exclude"] : [];
        var walker = new dirParser();
        if (!fs.existsSync(answers["output_directory"]))
            fs.mkdirSync(answers["output_directory"]);
        else
            cleanOutputDir(answers["output_directory"]);

        walker.on('DoneWalking', function(files, data) {
            StartParsing(files,answers["output_directory"]);
            writeIndexFile(answers["output_directory"]);
            console.log();
            console.log("***************************************");
            console.log("************ DONE PROCESSING **********");
            console.log("***************************************");
            startWebServer(answers["output_directory"]);
        });

        walker.walk(answers["dir_to_inspect"], exclusionDirectories, function (err, results) {
            if (err) {
                console.log(err);
                throw err;
            }
        });

    });

function StartParsing(files, output_directory){

    files.forEach(function (file) {
        parser.rip(file, output_directory);
    });
}
function startWebServer(outputDirectory) {
    server.startServer(3000, __dirname, outputDirectory);
};

function writeIndexFile(output_directory) {
    var retArray = [];
    var rippedFileNames = fs.readdirSync(output_directory);
    rippedFileNames.sort();

    rippedFileNames.forEach(function (fileName) {
        var obj = {};
        obj["link"] = "./"+path.join(output_directory, fileName);
        obj["filename"] = path.basename(fileName).replace(/\d+\.json$/, ".json");
        retArray.push(obj);
    });

    fs.writeFile(output_directory+"/rootIndex.json", JSON.stringify(retArray), function(err) {
        if(err) {
            return console.log(err);
        }
    });
}

function cleanOutputDir(dir){
    fs.readdirSync(dir).forEach(function(fileName) {
        fs.unlinkSync(path.join(dir, fileName));
    });
}