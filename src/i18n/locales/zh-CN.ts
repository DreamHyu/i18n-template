const zhCN = {
  app: {
    eyebrow: 'Vue 3 国际化基础模板',
    title: '从今天开始，把多语言做成项目骨架。',
    subtitle:
      '这个模板把 Vue 3、Pinia、vue-router 与 vue-i18n 串成一套干净的起步结构，让后续业务扩展更自然。',
    navigation: '主导航',
  },
  nav: {
    home: '首页',
    about: '关于模板',
  },
  common: {
    currentLanguage: '当前语言',
    fallback: '回退语言',
    persisted: '已持久化到 localStorage',
    yes: '是',
  },
  language: {
    label: '界面语言',
    hint: '切换后会立即更新页面文案，并在刷新后保留选择。',
    'zh-CN': '简体中文',
    'en-US': 'English',
  },
  home: {
    title: '一个适合作为业务起点的国际化骨架',
    description:
      '首页展示了文案渲染、语言切换、Pinia 状态和路由跳转，帮助你确认这套模板已经具备基础扩展能力。',
    runtime: '运行时能力',
    runtimeDescription: '语言状态、组件文案和浏览器文档语言会保持同步。',
    storeTitle: 'Pinia 状态示例',
    storeDescription: '点击按钮会修改共享状态，切到其他页面后仍然保留。',
    increment: '增加计数',
    countLabel: '当前计数',
    featuresTitle: '模板内置内容',
    featureRouting: '两页路由示例，验证跨页面语言状态一致',
    featurePersistence: '语言选择持久化，刷新后自动恢复',
    featureStructure: '国际化目录结构，适合继续扩展业务模块',
    featureFallback: '默认回退到中文，避免缺失 key 直接露出',
  },
  about: {
    title: '这套模板解决了哪些基础问题？',
    description:
      'About 页专门用来验证跨路由行为，以及展示回退文案在语言包缺失时仍然可控。',
    localeSync: 'Pinia 中的 locale 与 i18n 当前 locale 保持一致。',
    routing: '路由切换不会丢失你之前选择的语言。',
    fallbackTitle: '回退语言示例',
    fallbackDescription:
      '下面这行文案只存在于中文语言包中；当你切到英文时，它会自动回退到中文。',
    fallbackOnlyInChinese: '这是一条仅存在于中文语言包中的回退文案。',
    codeTitle: '推荐的国际化目录结构',
  },
} as const

export default zhCN
