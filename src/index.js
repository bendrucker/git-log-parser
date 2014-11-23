'use strict';

var spawn    = require('child_process').spawn;
var through  = require('through2');
var split    = require('split');
var traverse = require('traverse');
var fields   = require('./fields');

var END = '==END==';
var FIELD = '==FIELD==';

function format (fieldMap) {
  return '--format=' + 
    fieldMap.map(function (field) {
      return '%' + field.key;
    })
    .join(FIELD) +
    END;
}

function log (args) {
  var fieldMap = fields.map();
  var child = spawn('git', ['log', format(fieldMap)]);
  return child.stdout
    .pipe(split(END + '\n'))
    .pipe(through.obj(function (chunk, enc, callback) {
      if (!chunk) return callback();
      var data = chunk.toString('utf8').split(FIELD);
      var parsed = fieldMap.reduce(function (parsed, field, index) {
        var value = data[index];
        traverse(parsed).set(field.path, field.type ? new field.type(value) : value);
        return parsed;
      }, {});
      this.push(parsed);
      callback();
    }));
}

log()
  .pipe(through.obj(function (chunk, enc, cb) {
    // console.log(chunk)
    cb(null, JSON.stringify(chunk, null, 2)) 
  }))
  .pipe(process.stdout);

