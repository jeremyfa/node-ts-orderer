
var fs = require('fs');
var glob = require('glob');
var ts2json = require('ts2json');

function extractIdentifiersAndDependencies(ast, identifiers, dependencies) {
    if (ast._sourceUnit != null && ast._sourceUnit.moduleElements) {
        var elements = ast._sourceUnit.moduleElements;
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];

            if (element.classKeyword || element.interfaceKeyword) {
                var identifier = extract(element.identifier);
                identifiers[identifier] = 1;

                if (element.heritageClauses) {
                    var len = element.heritageClauses.length;
                    for (var j = 0; j < len; j++) {
                        var clause = element.heritageClauses[j];
                        var keyword = extract(clause.extendsOrImplementsKeyword);
                        var len2 = clause.typeNames.length;
                        for (var k = 0; k < len2; k++) {
                            var dep = extract(clause.typeNames[k]);
                            dependencies[dep] = 1;
                        }
                    }
                }
            }
        }
    }
}

function extract(input) {
    if (input.cachedText) {
        return input.cachedText;
    }
    else if (input._fullSart && input._fullWidth) {
        return this.ast.text.value.substr(input._fullStart, input._fullWidth).trim();
    }
    return null;
}

// Export function
module.exports = function(path) {
    // Files
    var tsFiles = glob.sync(path+'/**/*.ts');
    var orderedFiles = [];
    var addedFiles = {};
    var filesByIdentifier = {};

    // info by file
    var infoByFile = {};

    // Compute classes and dependencies
    for (var i = 0; i < tsFiles.length; i++) {
        var file = tsFiles[i];
        var data = String(fs.readFileSync(file));
        var ast = ts2json(data);
        identifiers = {};
        dependencies = {};
        extractIdentifiersAndDependencies(ast, identifiers, dependencies);
        for (var identifier in identifiers) {
            filesByIdentifier[identifier] = file;
        }
        infoByFile[file] = {
            identifiers: identifiers,
            dependencies: dependencies
        };
    }

    function addDependantFiles(file) {
        var info = infoByFile[file];
        for (var dependency in info.dependencies) {
            var dependantFile = filesByIdentifier[dependency];
            if (dependantFile && !addedFiles[dependantFile]) {
                addDependantFiles(dependantFile);
                addFile(dependantFile);
            }
        }
    }

    function addFile(file) {
        if (!addedFiles[file]) {
            addedFiles[file] = 1;
            orderedFiles.push(file);
        }
    }

    // Order files
    for (var file in infoByFile) {
        addDependantFiles(file);
        addFile(file);
    }

    // Return result
    return orderedFiles;
};
