import { galleryGroups } from './examples/groups.js';

export default {
  paths() {
    return galleryGroups
      .flatMap((group) => group.items)
      .map((example) => ({
        params: {
          id: example.id,
          title: example.title,
        },
      }));
  },
};
