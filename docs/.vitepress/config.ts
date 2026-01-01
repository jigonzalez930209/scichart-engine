import { defineConfig } from "vitepress";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const base = '/scichart-engine/';

export default defineConfig({
  base,
  title: "SciChart Engine",
  description:
    "High-performance WebGL scientific charting engine for data visualization",
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg` }],
    ['meta', { name: 'theme-color', content: '#00f2ff' }],
  ],
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
    logo: '/logo.svg',
    siteTitle: 'SciChart Engine',
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
            { text: "Plugin System", link: "/guide/plugins" },
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
            { text: "Band Series", link: "/api/band-series" },
            { text: "Step Charts", link: "/api/step-charts" },
            { text: "Scatter Symbols", link: "/api/scatter-symbols" },
            { text: "Bar Charts", link: "/api/bar-charts" },
            { text: "Heatmaps", link: "/api/heatmap" },
            { text: "Candlestick", link: "/api/candlestick" },
            { text: "Error Bars", link: "/api/error-bars" },
            { text: "Annotations", link: "/api/annotations" },
            { text: "Plugins", link: "/api/plugins" },
            { text: "Statistics Panel", link: "/api/statistics-panel" },
            { text: "Data Export", link: "/api/export" },
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
            { text: "Curve Fitting", link: "/api/fitting" },
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
            { text: "Area Charts", link: "/examples/area-charts" },
            { text: "Multiple Y-Axes", link: "/examples/multiple-y-axes" },
            { text: "Step Charts", link: "/examples/step-charts" },
            { text: "Scatter Symbols", link: "/examples/scatter-symbols" },
            { text: "Error Bars", link: "/examples/error-bars" },
            { text: "Annotations", link: "/examples/annotations" },
            { text: "Real-time Streaming", link: "/examples/realtime" },
            { text: "Large Datasets", link: "/examples/large-datasets" },
            { text: "React Integration", link: "/examples/react" },
            { text: "Curve Fitting", link: "/examples/curve-fitting" },
            { text: "Peak Analysis", link: "/examples/analysis" },
            { text: "Bar Charts", link: "/examples/bar-charts" },
            { text: "Heatmaps", link: "/examples/heatmap" },
            { text: "Candlestick", link: "/examples/candlestick" },
            { text: "Stacked Charts", link: "/examples/stacked-charts" },
            { text: "Statistics Panel", link: "/examples/statistics" },
          ],
        },
        // =================================================================
        // GPU Rendering - IN DEVELOPMENT (no testing)
        // Uncomment when ready for production
        // =================================================================
        // {
        //   text: "GPU Rendering",
        //   items: [
        //     { text: "WebGPU Overview", link: "/examples/webgpu" },
        //     { text: "GPU Showcase", link: "/examples/gpu-showcase" },
        //     { text: "GPU Benchmark", link: "/demos/benchmark.html" },
        //     { text: "GPU Compute", link: "/examples/gpu-compute" },
        //     { text: "WebGPU vs WebGL", link: "/examples/gpu-comparison" },
        //   ],
        // },
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
