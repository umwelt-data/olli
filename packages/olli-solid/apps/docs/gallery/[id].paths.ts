import { examples } from './examples/index.js';

export default {
  paths() {
    return examples.map((example) => ({
      params: {
        id: example.id,
        title: example.title,
      },
    }));
  },
};
