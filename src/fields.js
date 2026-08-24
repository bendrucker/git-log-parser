import traverse from 'traverse';

export const config = {
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

export function map() {
  return traverse.reduce(config, function (fields, node) {
    if (this.isLeaf && typeof node === 'string') {
      const typed = this.key === 'key';
      fields.push({
        path: typed ? this.parent.path : this.path,
        key: node,
        type: this.parent.node.type
      });
    }
    return fields;
  }, []);
}
