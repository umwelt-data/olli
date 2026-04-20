import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import GalleryIndex from '../../gallery/components/GalleryIndex.vue';
import ExamplePage from '../../gallery/components/ExamplePage.vue';
import 'olli-js/styles.css';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('GalleryIndex', GalleryIndex);
    app.component('ExamplePage', ExamplePage);
  },
} satisfies Theme;
