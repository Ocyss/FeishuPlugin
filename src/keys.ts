import type { VueI18n } from 'vue-i18n'

export const tKey: InjectionKey<VueI18n['t']> = Symbol('i18nTranslationFunction')
