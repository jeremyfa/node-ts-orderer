
var fs = require('fs');
var tsOrderer = require('./tsOrderer');

var orderedFiles = tsOrderer(__dirname+'/../example');

process.stdout.write(String(orderedFiles));
