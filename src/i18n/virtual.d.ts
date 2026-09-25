// vite.config.ts içindeki `i18nSlices` eklentisinin ürettiği dil modülleri.
declare module 'virtual:i18n/*' {
  import type { FullDictionary } from './source';
  const dictionary: FullDictionary;
  export default dictionary;
}
