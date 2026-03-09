export default defineNuxtConfig({
  devtools: { enabled: true },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    redirect: false,
  },
  app: {
    head: {
      title: '帳 · Flow',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1, viewport-fit=cover' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@300;400&family=Noto+Serif+TC:wght@300;400&family=Noto+Sans+TC:wght@300;400&display=swap',
        },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  compatibilityDate: '2024-11-01',
})
