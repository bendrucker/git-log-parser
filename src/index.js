'use strict';

var spawn    = require('child_process').spawn;
var through  = require('through2');
var split    = require('split');
var traverse = require('traverse');
var fields   = require('./fields');
var toArgv   = require('argv-formatter').format;

var END = '==END==';
var FIELD = '==FIELD==';

function format (fieldMap) {
  return fieldMap.map(function (field) {
      return '%' + field.key;
    })
    .join(FIELD) + END;
}

function trim () {
  return through(function (chunk, enc, callback) {
    if (!chunk) {
      callback();
    }
    else {
      callback(null, chunk);
    }
  });
}

function log (args) {
  var child = spawn('git', ['log'].concat(args));
  return child.stdout
    .pipe(split(END + '\n'))
    .pipe(trim());
}

function args (config, fieldMap) {
  config.format = format(fieldMap);
  return toArgv(config);
}

exports.parse = function parseLogStream (config) {
  config  = config || {};
  var map = fields.map();
  return log(args(config, map))
    .pipe(through.obj(function (chunk, enc, callback) {
      var fields = chunk.toString('utf8').split(FIELD);
      callback(null, map.reduce(function (parsed, field, index) {
        var value = fields[index];
        traverse(parsed).set(field.path, field.type ? new field.type(value) : value);
        return parsed;
      }, {}));
    }));
};
