import { galleryPathsMetadata } from './examples/paths-metadata.js';

export default {
  paths() {
    return galleryPathsMetadata.map((example) => ({
      params: {
        id: example.id,
        title: example.title,
      },
    }));
  },
};
