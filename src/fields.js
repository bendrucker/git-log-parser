'use strict';

exports.config = {
  commit: {
    long: 'H',
    short: 'h'
  },
  tree: {
    long: 'T',
    short: 't'
  },
  author: {
    name: 'an',
    email: 'ae',
    date: {
      key: 'ai',
      type: Date
    }
  },
  committer: {
    name: 'cn',
    email: 'ce',
    date: {
      key: 'ci',
      type: Date
    }
  },
  subject: 's',
  body: 'b'
};

exports.map = function () {
  var fields = [];

  function crawl(node, path, parent) {
    if (typeof node === 'object') {
      for (var childKey in node) {
        if (!Object.prototype.hasOwnProperty.call(node, childKey)) continue;
        path.push(childKey);
        crawl(node[childKey], path, node);
        path.pop(childKey);
      }
    } else if (typeof node === 'string') {
      var typed = path[path.length - 1] === 'key';
      fields.push({
        path: typed ? path.slice(0, path.length - 1) : path.slice(0),
        key: node,
        type: parent.type
      });
    }
  }

  crawl(exports.config, [], undefined);

  return fields;
};
