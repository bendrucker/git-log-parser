import { spawn } from 'node:child_process';
import through from 'through2';
import split from 'split2';
import traverse from 'traverse';
import combine from 'stream-combiner2';
import fwd from 'spawn-error-forwarder';
import argvFormatter from 'argv-formatter';
import * as fields from './fields.js';

const toArgv = argvFormatter.format;

const END = '==END==';
const FIELD = '==FIELD==';

function format(fieldMap) {
  return fieldMap.map((field) => '%' + field.key)
    .join(FIELD) + END;
}

function trim() {
  return through((chunk, enc, callback) => {
    if (!chunk) {
      callback();
    } else {
      callback(null, chunk);
    }
  });
}

function log(args, options) {
  return fwd(spawn('git', ['log'].concat(args), options), (code, stderr) => {
    return new Error('git log failed:\n\n' + stderr);
  })
  .stdout;
}

function args(config, fieldMap) {
  config.format = format(fieldMap);
  return toArgv(config);
}

export function parse(config, options) {
  config = config || {};
  const map = fields.map();
  return combine.obj([
    log(args(config, map), options),
    split(END + '\n'),
    trim(),
    through.obj((chunk, enc, callback) => {
      const fieldValues = chunk.toString('utf8').split(FIELD);
      callback(null, map.reduce((parsed, field, index) => {
        const value = fieldValues[index];
        traverse(parsed).set(field.path, field.type ? new field.type(value) : value);
        return parsed;
      }, {}));
    })
  ]);
}

const fieldsConfig = fields.config;
export { fieldsConfig as fields }
