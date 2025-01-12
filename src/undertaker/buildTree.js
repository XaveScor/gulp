const map = require('collection-map');

const metadata = require('./metadata');

function buildTree(tasks) {
  return map(tasks, function (task) {
    let meta = metadata.get(task);
    if (meta) {
      return meta.tree;
    }

    const name = task.displayName || task.name || '<anonymous>';
    meta = {
      name: name,
      tree: {
        label: name,
        type: 'function',
        nodes: [],
      },
    };

    metadata.set(task, meta);
    return meta.tree;
  });
}

module.exports = buildTree;
