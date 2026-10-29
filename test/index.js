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

  describe('when git output is cut inside a commit separator', function () {

    var childProcess = require('child_process');
    var PassThrough  = require('stream').PassThrough;
    var spawn        = childProcess.spawn;
    var replayed     = false;
    var commits      = [];

    before(function (done) {
      // A pipe read can end anywhere, e.g. between ==END== and its newline
      childProcess.spawn = function (command, args, options) {
        var child  = spawn.apply(childProcess, arguments);
        var output = childProcess.execFileSync(command, args, options).toString();
        expect(output).to.contain('==END==\n');
        var cut    = output.indexOf('==END==\n') + '==END=='.length;
        var stdout = new PassThrough();
        stdout.write(output.slice(0, cut));
        setTimeout(function () {
          stdout.end(output.slice(cut));
        }, 10);
        child.stdout.resume();
        child.stdout = stdout;
        replayed = true;
        return child;
      };
      // the parser binds spawn when loaded
      delete require.cache[require.resolve('../')];
      require('../').parse({
        _: ['--',  './test/versioned/*']
      })
      .on('data', function (data) {
        commits.push(data);
      })
      .on('error', done)
      .on('end', done);
    });

    after(function () {
      childProcess.spawn = spawn;
      delete require.cache[require.resolve('../')];
    });

    it('keeps every commit', function () {
      expect(replayed).to.equal(true);
      expect(commits).to.have.length(2);
    });

  });

});
