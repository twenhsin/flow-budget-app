export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  supabase: {
    redirect: false,
  },
  app: {
    head: {
      title: 'Filo',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover' },
      ],
      script: [{ src: 'https://mcp.figma.com/mcp/html-to-design/capture.js', async: true }],
      link: [
        { rel: 'apple-touch-icon', href: '/icon/icon-192.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@300;400&family=Noto+Serif+TC:wght@300;400&family=Noto+Sans+TC:wght@300;400&display=swap',
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Filo',
      short_name: 'Filo',
      description: '讓 AI 幫你整理每一筆消費',
      lang: 'zh-TW',
      theme_color: '#E07A4F',
      background_color: '#FDF6F0',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icon/favicon-16.png',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          src: '/icon/favicon-32.png',
          sizes: '32x32',
          type: 'image/png',
        },
        {
          src: '/icon/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icon/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: false,
    },
  },
  compatibilityDate: '2024-11-01',
})
