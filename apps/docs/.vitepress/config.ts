import { defineConfig } from 'vitepress';
import solidPlugin from 'vite-plugin-solid';
import { galleryGroups } from '../gallery/examples/groups.js';

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
        {
          text: 'Visualization Specs',
          items: [
            { text: 'OlliVisSpec', link: '/docs/vis-spec' },
            { text: 'Fields, Axes & Legends', link: '/docs/vis-fields' },
            { text: 'Structure Nodes', link: '/docs/vis-structure' },
            { text: 'Vis Lowering', link: '/docs/vis-lowering' },
          ],
        },
        {
          text: 'Diagram Specs',
          items: [
            { text: 'DiagramSpec', link: '/docs/diagram-spec' },
            { text: 'Relations', link: '/docs/diagram-relations' },
            { text: 'Diagram Lowering', link: '/docs/diagram-lowering' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Hypergraph', link: '/docs/hypergraph' },
            { text: 'Navigation Tree', link: '/docs/navtree' },
            { text: 'Navigation Runtime', link: '/docs/runtime' },
            { text: 'Predicates & Selection', link: '/docs/predicates' },
          ],
        },
        {
          text: 'Description System',
          items: [
            { text: 'Tokens', link: '/docs/tokens' },
            { text: 'Recipes & Customization', link: '/docs/recipes' },
            { text: 'Presets', link: '/docs/presets' },
          ],
        },
        {
          text: 'Extending Olli',
          items: [
            { text: 'Domain Architecture', link: '/docs/domains' },
            { text: 'Creating a Domain', link: '/docs/creating-domain' },
            { text: 'Contributing Tokens', link: '/docs/domain-tokens' },
            { text: 'Contributing Dialogs', link: '/docs/domain-dialogs' },
            { text: 'Contributing Keybindings', link: '/docs/domain-keybindings' },
            { text: 'Contributing Predicates', link: '/docs/domain-predicates' },
          ],
        },
      ],
      '/gallery/': [
        { text: 'Gallery', link: '/gallery/' },
        ...galleryGroups.map((g) => ({
          text: g.label,
          items: g.items.map((ex) => ({ text: ex.title, link: `/gallery/${ex.id}/` })),
        })),
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
