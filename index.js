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
        message: "Provide one or more directories to exclude from processing (comma separated):",
        when: function (answers) {
            return answers["has_exclusion_directory"]
        },
        validate: function (dir) {
            var directories = dir.split(',');
            directories.forEach(function (dir) {
                try {
                    fs.statSync(dir).isDirectory()
                }
                catch (er) {
                    return "Directory '" + dir + "'' provided does not exist."
                }
            });
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
        default: path.normalize("./output")
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
            StartParsing(files, answers["output_directory"], answers["dirs_to_exclude"]);
        });

        walker.walk(answers["dir_to_inspect"], exclusionDirectories, function (err, results) {
            if (err) {
                console.log(err);
                throw err;
            }
        });

    });

function StartParsing(files, output_directory, exclusionDirs){
     var ripper = new parser();
     ripper.rip(files, output_directory);
     ripper.on("DoneProcessing",function(data){
        console.log();
        console.log("***************************************");
        console.log("************ DONE PROCESSING **********");
        console.log("***************************************");
        writeIndexFile(output_directory, data, exclusionDirs);
        startWebServer(output_directory);
     });
}
function startWebServer(outputDirectory) {
    server.startServer(3000, __dirname, outputDirectory);
};

function writeIndexFile(output_directory, files, exclusionDirs) {
    files.sort(indexSort);
    var indexData = {};
    indexData["files"] = files;
    indexData["number"] = files.length;
    indexData["exclusionDirs"] = exclusionDirs ? exclusionDirs : "None";

    fs.writeFile(output_directory+"/rootIndex.json", JSON.stringify(indexData), function(err) {
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

function indexSort(a,b)
{
    if (a.filePath < b.filePath)
        return -1;
    if (a.filePath > b.filePath)
        return 1;
    return 0;
}