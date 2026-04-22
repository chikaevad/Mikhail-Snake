import defineConfig, { presets } from '@deutschlandgpt/prettier-config';

export default defineConfig(presets.nextjs({ packageJson: true }));
