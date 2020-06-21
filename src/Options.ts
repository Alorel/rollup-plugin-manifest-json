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
   * Whether to minify the output or not
   * @default true
   */
  minify?: boolean;
}

interface Output extends Base {
  /**
   * Whether to watch the input file for changes.
   * false makes this function as an output plugin
   * true makes this function as a plugin
   * @default false
   */
  watch?: false;
}

interface Input extends Base {
  /**
   * Whether to watch the input file for changes.
   * false (default) makes this function as an output plugin
   * true makes this function as a plugin
   * @default false
   */
  watch: true;
}

type ManifestJsonPluginOptions = Input | Output;

export {
  ManifestJsonPluginOptions,
  Input as ManifestJsonPluginInputOptions,
  Output as ManifestJsonPluginOutputOptions
};
