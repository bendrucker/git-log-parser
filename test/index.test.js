import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import * as logParser from '../src/index.js';

describe('git-log-parser', () => {
  const commits = [];

  before(() => {
    return new Promise((resolve, reject) => {
      logParser.parse({
        _: ['--', './test/versioned/*']
      })
      .on('data', (data) => commits.push(data))
      .on('error', reject)
      .on('end', resolve);
    });
  });

  it('creates a stream of commit objects', () => {
    assert.equal(commits.length, 2);
  });

  it('types dates', () => {
    assert.ok(commits[0].author.date instanceof Date);
    assert.ok(commits[0].committer.date instanceof Date);
  });

  it('emits errors', () => {
    return new Promise((resolve, reject) => {
      logParser.parse({
        _: 'causefailure'
      })
      .on('error', (err) => {
        try {
          assert.match(err.message, /^git log failed:/);
          assert.ok(err.message.includes('causefailure'));
          resolve();
        } catch (assertionErr) {
          reject(assertionErr);
        }
      })
      .on('end', () => {
        reject(new Error('Expected stream to fail, but it completed successfully'));
      });
    });
  });
});
