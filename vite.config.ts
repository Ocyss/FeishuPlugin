import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { NaiveUiResolver } from "unplugin-vue-components/resolvers";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import VueRouter from "unplugin-vue-router/vite";
import { VueRouterAutoImports } from "unplugin-vue-router";

const pathSrc = path.resolve(__dirname, "src");
const basePkg = ["bitable", "FieldType", ["*", "base"]];
const baseType = [
  "ITableMeta",
  "IOpenCellValue",
  "IOpenSegment",
  "IFieldMeta",
  "IGetRecordsResponse",
  "IRecord",
  "IOpenSingleSelect",
  "IOpenUser",
  "IOpenUrlSegment",
  "IOpenAttachment",
  "IOpenLink",
  "IOpenLocation",
  "IOpenGroupChat",
  "ITable",
  "IRecordType",
  "IAttachmentField",
  "ICell",
  "IViewMeta",
  "IView",
];
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    VueRouter({ routesFolder: "src/views" }),
    vue(),
    AutoImport({
      imports: [
        "vue",
        VueRouterAutoImports,
        {
          "naive-ui": [
            "useDialog",
            "useMessage",
            "useNotification",
            "useLoadingBar",
          ],
          "@lark-base-open/js-sdk": basePkg as string[],
          "vue-i18n": ["useI18n"],
        },
        {
          from: "@lark-base-open/js-sdk",
          imports: baseType,
          type: true,
        },
      ],
      eslintrc: {
        enabled: true,
      },
      vueTemplate: true,
      dts: path.resolve(pathSrc, "auto-imports.d.ts"),
    }),
    Components({
      resolvers: [NaiveUiResolver()],
      dts: path.resolve(pathSrc, "components.d.ts"),
    }),
    VueI18nPlugin({
      include: [path.resolve(__dirname, "./src/locales/**")],
      strictMessage: false,
    }),
  ],
  resolve: {
    alias: {
      "@": pathSrc,
    },
  },
});
