import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/refrag/__docusaurus/debug',
    component: ComponentCreator('/refrag/__docusaurus/debug', '32c'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/config',
    component: ComponentCreator('/refrag/__docusaurus/debug/config', 'fd3'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/content',
    component: ComponentCreator('/refrag/__docusaurus/debug/content', '546'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/globalData',
    component: ComponentCreator('/refrag/__docusaurus/debug/globalData', 'fe7'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/metadata',
    component: ComponentCreator('/refrag/__docusaurus/debug/metadata', '761'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/registry',
    component: ComponentCreator('/refrag/__docusaurus/debug/registry', '5aa'),
    exact: true
  },
  {
    path: '/refrag/__docusaurus/debug/routes',
    component: ComponentCreator('/refrag/__docusaurus/debug/routes', 'e2b'),
    exact: true
  },
  {
    path: '/refrag/',
    component: ComponentCreator('/refrag/', '901'),
    routes: [
      {
        path: '/refrag/',
        component: ComponentCreator('/refrag/', 'b05'),
        routes: [
          {
            path: '/refrag/',
            component: ComponentCreator('/refrag/', '1b7'),
            routes: [
              {
                path: '/refrag/browser-support',
                component: ComponentCreator('/refrag/browser-support', '34e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/refrag/html-shader',
                component: ComponentCreator('/refrag/html-shader', '68e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/refrag/is-api-supported',
                component: ComponentCreator('/refrag/is-api-supported', '336'),
                exact: true
              },
              {
                path: '/refrag/use-html-texture',
                component: ComponentCreator('/refrag/use-html-texture', 'f2d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/refrag/',
                component: ComponentCreator('/refrag/', '7d3'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
