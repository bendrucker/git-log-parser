'use strict';

var spawn         = require('child_process').spawn;
var through       = require('through2');
var messageParser = require('git-commit-message-parser');

function log (args) {
  var child = spawn('git', ['log', '--pretty=%H%n%s%n%b%n==END==']);
  child.stdout.pipe(process.stdout);
}

log();