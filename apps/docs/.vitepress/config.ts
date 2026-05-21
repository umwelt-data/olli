import { defineConfig } from 'vitepress';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  vite: {
    plugins: [solidPlugin({ ssr: true })],
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
      { text: 'Using Olli', link: '/using/', activeMatch: '/using/' },
      { text: 'Developer Docs', link: '/docs/', activeMatch: '/docs/' },
      { text: 'Gallery', link: '/gallery/', activeMatch: '/gallery/' },
    ],

    sidebar: {
      '/using/': [
        {
          text: 'Using Olli',
          items: [
            { text: 'Getting Started', link: '/using/' },
            { text: 'Keyboard Controls', link: '/using/keyboard-controls' },
            { text: 'Understanding the Tree', link: '/using/tree-structure' },
            { text: 'Navigating Charts', link: '/using/charts' },
            { text: 'Navigating Diagrams', link: '/using/diagrams' },
            { text: 'Dialogs', link: '/using/dialogs' },
            { text: 'Customizing Descriptions', link: '/using/descriptions' },
          ],
        },
      ],
      '/docs/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/docs/' },
            { text: 'Quickstart', link: '/docs/quickstart' },
            { text: 'Installation', link: '/docs/installation' },
          ],
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Entry Points', link: '/docs/entry-points' },
            { text: 'OlliHandle', link: '/docs/handle' },
            { text: 'Options & Callbacks', link: '/docs/options' },
            { text: 'Adapters', link: '/docs/adapters' },
          ],
        },
        {
          text: 'Theming',
          items: [
            { text: 'Theming & CSS', link: '/docs/theming' },
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
      pattern: 'https://github.com/umwelt-data/olli/edit/main/apps/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the BSD-3-Clause License.',
      copyright: 'Copyright © 2022-present the Olli contributors',
    },
  },

});
