interface Window {
  $t?: VueI18nTranslation<
    Messages,
    Locales,
    RemoveIndexSignature<{
      [K in keyof DefineLocaleMessage]: DefineLocaleMessage[K];
    }>
  >;
  $message?: MessageApiInjection;
}
