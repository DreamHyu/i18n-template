const enUS = {
  app: {
    eyebrow: 'Vue 3 i18n Starter',
    title: 'Turn localization into part of the project foundation.',
    subtitle:
      'This starter wires Vue 3, Pinia, vue-router, and vue-i18n into a clean baseline that scales into real product work.',
    navigation: 'Primary navigation',
  },
  nav: {
    home: 'Home',
    about: 'About',
  },
  common: {
    currentLanguage: 'Current language',
    fallback: 'Fallback locale',
    persisted: 'Persisted in localStorage',
    yes: 'Yes',
  },
  language: {
    label: 'Interface language',
    hint: 'Switching updates text instantly and keeps your choice after refresh.',
    'zh-CN': '简体中文',
    'en-US': 'English',
  },
  home: {
    title: 'An i18n scaffold that is ready for real project growth',
    description:
      'The home page demonstrates translated copy, locale switching, Pinia state, and routing so you can verify the starter is ready to extend.',
    runtime: 'Runtime behavior',
    runtimeDescription: 'Locale state, translated content, and the document language stay in sync.',
    storeTitle: 'Pinia state example',
    storeDescription: 'Click the button to update shared state and keep it across route changes.',
    increment: 'Increase count',
    countLabel: 'Current count',
    featuresTitle: 'Included out of the box',
    featureRouting: 'Two routed pages to verify locale consistency across navigation',
    featurePersistence: 'Persisted locale selection that restores after refresh',
    featureStructure: 'A clear i18n folder structure that can grow with your modules',
    featureFallback: 'Chinese fallback content to avoid raw missing keys',
  },
  about: {
    title: 'What foundational problems does this starter solve?',
    description:
      'The About page is here to verify route-level behavior and to show how fallback content works when a key is missing in the active locale.',
    localeSync: 'The locale stored in Pinia stays aligned with the i18n locale.',
    routing: 'Navigation does not reset the language you already picked.',
    fallbackTitle: 'Fallback locale example',
    fallbackDescription:
      'The next line exists only in the Chinese locale bundle. When English is active, it should fall back automatically.',
    codeTitle: 'Suggested i18n structure',
  },
} as const

export default enUS
