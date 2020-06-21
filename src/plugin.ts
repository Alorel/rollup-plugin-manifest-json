import {OutputPlugin, Plugin, PluginContext} from 'rollup';
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

  const reader = new InputReader(input);
  let renderer: Renderer;

  const returnedPlugin: OutputPlugin | Plugin = {
    generateBundle(this: PluginContext) {
      if (!renderer) {
        this.error('Renderer not initialised? Not sure how we got to this stage but I can\'t continue.');
      } else if (!renderer.hasChanged) {
        return;
      } else {
        const {json, replacedKeys} = renderer;

        for (const k of replacedKeys.icons) {
          json.icons[k] = basePath + this.getFileName(json.icons[k]);
        }
        for (const {scriptIndex, sectionIndex, type} of replacedKeys.contentScripts) {
          const section = json.content_scripts[scriptIndex][type];
          section[sectionIndex] = basePath + this.getFileName(section[sectionIndex]);
        }

        const stringifyArgs: [any, null?, number?] = [json];
        if (!minify) {
          stringifyArgs.push(null, 2); //tslint:disable-line:no-magic-numbers
        }

        const source = JSON.stringify.apply(JSON, stringifyArgs);
        this.emitFile({
          fileName,
          source,
          type: 'asset'
        });
      }
    },
    name: 'rollup-plugin-manifest-json',
    renderStart(this: PluginContext) {
      return reader.read()
        .then((contents): void | Promise<void> => {
          if (reader.changed) {
            renderer = new Renderer(JSON.parse(contents), opts);

            return renderer.process(this);
          } else {
            renderer.hasChanged = false;
          }
        });
    }
  };

  if (watch) {
    (returnedPlugin as Plugin).buildStart = function (this: PluginContext) {
      this.addWatchFile(input);
    };
  }

  return returnedPlugin;
}