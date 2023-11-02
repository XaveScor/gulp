const jobo = await import('./index.js');

jobo.declareTask({
  name: 'test',
  fn: async () => {
    console.log('test');
  },
});

export default jobo.series('test');
