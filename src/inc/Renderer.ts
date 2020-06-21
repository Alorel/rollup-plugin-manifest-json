import {promises as fs} from 'fs';
import {relative} from 'path';
import {PluginContext} from 'rollup';
import {ManifestJsonPluginOptions} from '../Options';
import {ImageKey} from './ImageKey';
import {JsonInput} from './JsonInput';
import {noop} from './noop';
import {ReplacedKeys} from './ReplacedKeys';

/** @internal */
export class Renderer {
  public hasChanged = false;

  public readonly replacements: ReplacedKeys = {
    icons: [],
    screenshots: []
  };

  private readonly changeOperations: Promise<any>[] = [];

  private ctx: PluginContext;

  public constructor(
    public readonly json: JsonInput,
    private readonly opts: ManifestJsonPluginOptions
  ) {
  }

  public process(ctx: PluginContext): Promise<void> {
    this.ctx = ctx;
    this.processImages('icons');
    this.processImages('screenshots');

    if (this.changeOperations.length) {
      this.hasChanged = true;

      return Promise.all(this.changeOperations).then(noop);
    } else {
      this.hasChanged = false;

      return Promise.resolve();
    }
  }

  private processImages(key: ImageKey): void {
    const array = this.json[key];
    if (!array) {
      return;
    }

    for (let i = 0; i < array.length; i++) {
      const file = array[i];

      this.changeOperations.push(
        this.resolveAndReplaceUrl(file.src)
          .then(assetId => {
            if (!assetId) {
              return;
            }

            file.src = assetId;
            this.replacements[key].push(i);
          })
      );
    }
  }

  private resolveAndReplaceUrl(url: string): Promise<void | string> {
    return this.ctx.resolve(url, this.opts.input)
      .then<void | string>(resolved => {
        if (!resolved || resolved.external) {
          return;
        }

        return fs.readFile(resolved.id)
          .then<string>(source => {
            return this.ctx.emitFile({
              name: `${relative(this.opts.baseDir!, resolved.id)}`,
              source,
              type: 'asset'
            });
          });
      });
  }
}
