import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "SciChart Engine",
  description: "High-performance scientific charting engine",
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Quick Start', link: '/guide/' },
          { text: 'Core Concepts', link: '/guide/concepts' }
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Chart', link: '/api/chart' },
          { text: 'Series', link: '/api/series' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jigonzalez930209/scichart-engine' }
    ]
  }
})
