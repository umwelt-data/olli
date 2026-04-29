import { defineConfig } from 'vitepress';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  vite: {
    plugins: [solidPlugin()],
    resolve: {
      conditions: ['development', 'browser'],
    },
  },
  title: 'Olli',
  description: 'Accessible tree-navigation views of data visualizations and diagrams.',
  base: '/olli/',
  cleanUrls: true,
  lastUpdated: true,
  lang: 'en-US',
  srcExclude: ['**/README.md','**/CLAUDE.md'],
  appearance: false,

  ignoreDeadLinks: [
    // Dynamic gallery routes are generated at build time from [id].paths.ts;
    // the link checker can't see them.
    /^\/gallery\/[^/]+$/,
  ],

  head: [['link', { rel: 'icon', href: '/olli/favicon.svg', type: 'image/svg+xml' }]],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/', activeMatch: '/guide/' },
      { text: 'Gallery', link: '/gallery/', activeMatch: '/gallery/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [{ text: 'What is Olli?', link: '/guide/' }],
        },
        {
          text: 'Using Olli',
          items: [
            { text: 'Tutorial', link: '/guide/tutorial' },
            { text: 'Concepts', link: '/guide/concepts' },
            { text: 'Visualizations', link: '/guide/visualizations' },
            { text: 'Diagrams', link: '/guide/diagrams' },
          ],
        },
        {
          text: 'Integrating Olli',
          items: [
            { text: 'Quickstart', link: '/guide/quickstart' },
            { text: 'Entry points', link: '/guide/entry-points' },
            { text: 'Theming', link: '/guide/theming' },
            { text: 'Extending Olli', link: '/guide/extending' },
          ],
        },
      ],
      '/gallery/': [
        {
          text: 'Gallery',
          items: [{ text: 'All examples', link: '/gallery/' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/umwelt-data/olli' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/umwelt-data/olli/edit/main/packages/olli-solid/apps/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the BSD-3-Clause License.',
      copyright: 'Copyright © 2022-present the Olli contributors',
    },
  },

});
