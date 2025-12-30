import { defineConfig } from "vitepress";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  title: "SciChart Engine",
  description:
    "High-performance WebGL scientific charting engine for data visualization",
  ignoreDeadLinks: true,
  vite: {
    resolve: {
      alias: {
        "@src": path.resolve(__dirname, "../../src"),
      },
    },
    server: {
      fs: {
        allow: [".."],
      },
    },
  },
  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
      {
        text: "Contributing",
        link: "https://github.com/jigonzalez930209/scichart-engine/blob/main/CONTRIBUTING.md",
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Getting Started",
          items: [
            { text: "Introduction", link: "/guide/" },
            { text: "Installation", link: "/guide/installation" },
            { text: "Quick Start", link: "/guide/quick-start" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Chart Architecture", link: "/guide/concepts" },
            { text: "Series & Data", link: "/guide/series" },
            { text: "Interactions", link: "/guide/interactions" },
            { text: "Theming", link: "/guide/theming" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "Performance", link: "/guide/performance" },
            { text: "Real-time Data", link: "/guide/realtime" },
            { text: "Large Datasets", link: "/guide/large-datasets" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Core API",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "createChart", link: "/api/chart" },
            { text: "Series", link: "/api/series" },
            { text: "Events", link: "/api/events" },
          ],
        },
        {
          text: "React",
          items: [
            { text: "SciChart Component", link: "/api/react-scichart" },
            { text: "useSciChart Hook", link: "/api/react-hook" },
          ],
        },
        {
          text: "Data Analysis",
          items: [
            { text: "Overview", link: "/api/analysis" },
            { text: "Cycle Detection", link: "/api/analysis-cycles" },
            { text: "Peak Detection", link: "/api/analysis-peaks" },
            { text: "Data Utilities", link: "/api/analysis-utils" },
          ],
        },
        {
          text: "Theming",
          items: [
            { text: "Built-in Themes", link: "/api/themes" },
            { text: "Custom Themes", link: "/api/custom-themes" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Overview", link: "/examples/" },
            { text: "Basic Chart", link: "/examples/basic" },
            { text: "Real-time Streaming", link: "/examples/realtime" },
            { text: "Large Datasets", link: "/examples/large-datasets" },
            { text: "React Integration", link: "/examples/react" },
          ],
        },
      ],
    },
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/jigonzalez930209/scichart-engine",
      },
    ],
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2025-present SciChart Engine",
    },
  },
});
