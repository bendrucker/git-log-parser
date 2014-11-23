'use strict';

var expect    = require('chai').expect;
var logParser = require('../');

describe('git-log-parser', function () {

  var commits = [];
  before(function (done) {
    logParser.parse({
      _: ['--',  './test/versioned/*']
    })
    .on('data', function (data) {
      commits.push(data);
    })
    .on('error', done)
    .on('end', done);
  });

  it('creates a stream of commit objects', function () {
    expect(commits).to.have.length(2);
  });

  it('types dates', function () {
    expect(commits[0].author.date).to.be.an.instanceOf(Date);
    expect(commits[0].committer.date).to.be.an.instanceOf(Date);
  });

  it('emits errors', function (done) {
    logParser.parse({
      _: 'causefailure'
    })
    .on('error', function (err) {
      expect(err.message)
        .to.match(/^git log failed:/)
        .and.contain('causefailure');
      done();
    });
  });

});
