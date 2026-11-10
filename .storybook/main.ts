import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  webpackFinal: async (webpackConfig) => {
    // Pastikan rule babel-loader untuk ts/tsx diterapkan
    webpackConfig.module = webpackConfig.module || { rules: [] };
    webpackConfig.module.rules = webpackConfig.module.rules || [];

    webpackConfig.module.rules.push({
      test: /\.(tsx?|jsx?)$/,
      exclude: /node_modules/,
      use: {
        loader: "babel-loader",
        options: {
          configFile: true,
        },
      },
    });

    return webpackConfig;
  },
  docs: {},
};

export default config;
