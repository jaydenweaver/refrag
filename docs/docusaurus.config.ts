import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "refrag",
  tagline: "HTML-in-Canvas for React",
  favicon: "img/favicon.ico",

  url: "https://jaydenweaver.github.io",
  baseUrl: "/refrag/",

  organizationName: "jaydenweaver",
  projectName: "refrag",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/jaydenweaver/refrag/edit/main/docs/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: "refrag",
      items: [
        {
          href: "https://github.com/jaydenweaver/refrag",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          label: "GitHub",
          href: "https://github.com/jaydenweaver/refrag",
        },
        {
          label: "WICG Spec",
          href: "https://github.com/WICG/html-in-canvas",
        },
      ],
      copyright: `MIT License. Built with Docusaurus.`,
    },
    prism: {
      additionalLanguages: ["glsl"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
