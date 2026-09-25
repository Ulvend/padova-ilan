import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig, type Plugin} from 'vite';
import {build as esbuild} from 'esbuild';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Çeviri dilimleyici: src/i18n/source.ts (tüm diller yan yana) ve src/utils/uiText.ts (satır başına 6 dil) derleme sırasında
// okunur; her dil için `virtual:i18n/<dil>` adlı ayrı bir modül üretilir. Böylece kaynak biçimi bozulmadan yalnızca
// kullanılan dil indirilir.
const I18N_PREFIX = 'virtual:i18n/';
const I18N_LANGS = ['tr', 'en', 'it', 'de', 'ru', 'hi'];

function i18nSlices(): Plugin {
  const sources = [path.join(rootDir, 'src/i18n/source.ts'), path.join(rootDir, 'src/utils/uiText.ts')];
  let cache: Promise<{BASE_TRANSLATIONS: Record<string, object>; EXTRA_TEXT: Record<string, object>}> | null = null;

  const evaluate = async () => {
    const result = await esbuild({
      stdin: {
        contents: "export { BASE_TRANSLATIONS } from './src/i18n/source.ts'; export { EXTRA_TEXT } from './src/utils/uiText.ts';",
        resolveDir: rootDir,
        loader: 'ts',
      },
      bundle: true,
      write: false,
      format: 'cjs',
      platform: 'node',
      logLevel: 'silent',
    });
    const mod = {exports: {}} as {exports: any};
    new Function('module', 'exports', result.outputFiles[0].text)(mod, mod.exports);
    return mod.exports;
  };

  return {
    name: 'i18n-slices',
    resolveId(id) {
      return id.startsWith(I18N_PREFIX) ? '\0' + id : null;
    },
    async load(id) {
      if (!id.startsWith('\0' + I18N_PREFIX)) return null;
      const lang = id.slice(('\0' + I18N_PREFIX).length);
      const {BASE_TRANSLATIONS, EXTRA_TEXT} = await (cache ??= evaluate());
      if (!BASE_TRANSLATIONS[lang] || !EXTRA_TEXT[lang]) throw new Error(`Bilinmeyen dil: ${lang}`);
      sources.forEach((file) => this.addWatchFile(file));
      return `export default ${JSON.stringify({...BASE_TRANSLATIONS[lang], ...EXTRA_TEXT[lang]})};`;
    },
    handleHotUpdate({file, server}) {
      if (!sources.includes(file)) return;
      cache = null;
      for (const lang of I18N_LANGS) {
        const mod = server.moduleGraph.getModuleById('\0' + I18N_PREFIX + lang);
        if (mod) server.moduleGraph.invalidateModule(mod);
      }
      server.ws.send({type: 'full-reload'});
      return [];
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), i18nSlices()],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
