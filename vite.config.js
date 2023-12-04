import path from 'node:path';
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import { VueRouterAutoImports } from 'unplugin-vue-router';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
const pathSrc = path.resolve(__dirname, 'src');
const basePkg = ['bitable', 'FieldType', 'ViewType', ['*', 'base']];
const baseType = [
    'ITableMeta',
    'IOpenCellValue',
    'FieldType',
    'IEventCbCtx',
    'Selection',
    'ViewType',
    'IOpenSegment',
    'IFieldMeta',
    'IGetRecordsResponse',
    'IRecord',
    'IOpenSingleSelect',
    'IOpenUser',
    'IOpenUrlSegment',
    'IOpenAttachment',
    'IOpenLink',
    'IOpenLocation',
    'IOpenGroupChat',
    'ITable',
    'IRecordType',
    'IAttachmentField',
    'ICell',
    'IViewMeta',
    'IView',
    'IRecordValue',
];
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        VueRouter({ routesFolder: 'src/views' }),
        vue(),
        AutoImport({
            dts: path.resolve(pathSrc, 'auto-imports.d.ts'),
            eslintrc: {
                enabled: true,
            },
            imports: [
                'vue',
                VueRouterAutoImports,
                {
                    '@lark-base-open/js-sdk': basePkg,
                    'naive-ui': [
                        'useDialog',
                        'useMessage',
                        'useNotification',
                        'useLoadingBar',
                    ],
                    'vue-i18n': ['useI18n'],
                },
                {
                    from: '@lark-base-open/js-sdk',
                    imports: baseType,
                    type: true,
                },
            ],
            vueTemplate: true,
        }),
        Components({
            dts: path.resolve(pathSrc, 'components.d.ts'),
            resolvers: [NaiveUiResolver()],
        }),
        VueI18nPlugin({
            include: [path.resolve(__dirname, './src/locales/**')],
            strictMessage: false,
        }),
        topLevelAwait({
            // The export name of top-level await promise for each chunk module
            promiseExportName: '__tla',
            // The function to generate import names of top-level await promise in each chunk module
            promiseImportName: i => `__tla_${i}`,
        }),
        nodePolyfills(),
    ],
    resolve: {
        alias: {
            '@': pathSrc,
        },
    },
    server: {
        host: true,
    },
});
