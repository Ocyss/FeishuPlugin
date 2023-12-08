interface Window {
  $message?: MessageApiInjection
  $t?: VueI18nTranslation<
  Messages,
  Locales,
  RemoveIndexSignature<{
    [K in keyof DefineLocaleMessage]: DefineLocaleMessage[K];
  }>
  >
}

interface Track {
  cellId?: null | string
  fieldId?: null | string
  recordId?: null | string
  tableId?: null | string
  viewId?: null | string
  value?: any
}

interface ModelType<TInput = string, TOutput = string> {
  input?: null | TInput
  output?: null | TOutput
}
