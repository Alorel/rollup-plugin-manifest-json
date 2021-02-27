import {OutputPlugin, Plugin, PluginContext} from 'rollup';
import {ImageKey} from './inc/ImageKey';
import {InputReader} from './inc/InputReader';
import {Renderer} from './inc/Renderer';
import {ManifestJsonPluginInputOptions, ManifestJsonPluginOptions, ManifestJsonPluginOutputOptions} from './Options';

export function manifestJsonPlugin(opts: ManifestJsonPluginOutputOptions): OutputPlugin;
export function manifestJsonPlugin(opts: ManifestJsonPluginInputOptions): Plugin;
export function manifestJsonPlugin(opts: ManifestJsonPluginOptions): OutputPlugin | Plugin {
  if (!opts) {
    throw new Error('Options missing');
  }

  const {
    baseDir = process.cwd(),
    basePath = '/',
    fileName,
    replace,
    input,
    minify = true,
    watch = false
  } = opts;

  if (!input) {
    throw new Error('input missing');
  } else if (!fileName) {
    throw new Error('fileName missing');
  }

  // Needed for the processor
  Object.assign(
    opts,
    {
      baseDir,
      basePath,
      minify,
      watch
    },
    opts
  );

  const reader = new InputReader(input, replace);
  let renderer: Renderer;

  const returnedPlugin: OutputPlugin | Plugin = {
    generateBundle(this: PluginContext) {
      if (!renderer) {
        this.error('Renderer not initialised? Not sure how we got to this stage but I can\'t continue.');
      } else if (!reader.changed) {
        return;
      }

      const stringifyArgs: [any?, number?] = minify ? [] : [null, 2]; //tslint:disable-line:no-magic-numbers

      if (renderer.hasChanged) {
        const {json, replacements} = renderer;

        for (const key of ['icons', 'screenshots'] as ImageKey[]) {
          for (const iconIndex of replacements[key]) {
            const image = json[key]![iconIndex];
            image.src = basePath + this.getFileName(image.src);
          }
        }
      }

      this.emitFile({
        fileName,
        source: JSON.stringify(renderer.json, ...stringifyArgs),
        type: 'asset'
      });
    },
    name: 'rollup-plugin-manifest-json',
    async renderStart(this: PluginContext): Promise<void> {
      const contents = await reader.read();

      if (reader.changed) {
        renderer = new Renderer(JSON.parse(contents), opts);
      }

      return renderer.process(this);
    }
  };

  if (watch) {
    (returnedPlugin as Plugin).buildStart = function (this: PluginContext) {
      this.addWatchFile(input);
    };
  }

  return returnedPlugin;
}
