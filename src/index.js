'use strict';

var spawn    = require('child_process').spawn;
var through  = require('through2');
var split    = require('split2');
var fields   = require('./fields');
var toArgv   = require('argv-formatter').format;
var combine  = require('stream-combiner2');
var fwd      = require('spawn-error-forwarder');

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

function log (args, options) {
  return fwd(spawn('git', ['log'].concat(args), options), function (code, stderr) {
    return new Error('git log failed:\n\n' + stderr);
  })
  .stdout;
}

function args (config, fieldMap) {
  config.format = format(fieldMap);
  return toArgv(config);
}

function setByPath(obj, path, value) {
  var dest = obj;
  for (var i = 0; i < path.length - 1; i++) {
    var key = path[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      obj[key] = {};
    }
    dest = dest[key];
  }

  dest[path[path.length - 1]] = value;
}

exports.parse = function parseLogStream (config, options) {
  config  = config || {};
  var map = fields.map();
  return combine.obj([
    log(args(config, map), options),
    split(END + '\n'),
    trim(),
    through.obj(function (chunk, enc, callback) {
      var fields = chunk.toString('utf8').split(FIELD);
      callback(null, map.reduce(function (parsed, field, index) {
        var value = fields[index];
        setByPath(parsed, field.path, field.type ? new field.type(value) : value);
        return parsed;
      }, {}));
    })
  ]);
};

exports.fields = fields.config;
