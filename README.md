Rollup plugin for generating a manifest.json.

Overall it just copies over a json file and replaces any relative
URLs in icons and screenshots with emitted asset links.

# Installation

[Configure npm for GitHub packages](https://help.github.com/en/packages/using-github-packages-with-your-projects-ecosystem/configuring-npm-for-use-with-github-packages)
then install `@alorel/rollup-plugin-manifest-json`

# Example

```javascript
import {manifestJsonPlugin} from '@alorel/rollup-plugin-manifest-json';
import {join} from 'path';

export default {
  ...stuff,
  plugins: [
    manifestJsonPlugin({
      input: join(__dirname, 'src', 'manifest.json'),
      fileName: 'manifest.json'
    })
  ]
}
```

# Options

```typescript
interface Base {
    /**
     * Base directory to resolve URLs from
     * @default process.cwd()
     */
    baseDir?: string;
    /**
     * Your public path
     * @default /
     */
    basePath?: string;
    /** Output file name */
    fileName: string;
    /** Manifest.json input file */
    input: string;

    /**
     * Array of regular expression search patterns & replacements. Effectively does
     * manifestJsonContents.replace(reg, string);
     */
    replace?: [[RegExp | string, string]];
    /**
     * Whether to minify the output or not
     * @default true
     */
    minify?: boolean;
    /**
     * Whether to watch the input file for changes.
     * false makes this function as an output plugin
     * true makes this function as a plugin
     * @default false
     */
    watch?: boolean;
}
```
