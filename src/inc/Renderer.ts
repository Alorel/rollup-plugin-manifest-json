import {promises as fs} from 'fs';
import {relative} from 'path';
import {PluginContext} from 'rollup';
import {ManifestJsonPluginOptions} from '../Options';
import {ImageKey} from './ImageKey';
import {JsonInput} from './JsonInput';
import {ReplacedKeys} from './ReplacedKeys';

/** @internal */
export class Renderer {
  private _hasChanged = false;

  private _replacements: ReplacedKeys;

  private changeOperations: Promise<any>[];

  private ctx: PluginContext;

  public constructor(
    public readonly json: JsonInput,
    private readonly opts: ManifestJsonPluginOptions
  ) {
  }

  public get hasChanged(): boolean {
    return this._hasChanged;
  }

  public get replacements(): ReplacedKeys {
    return this._replacements;
  }

  public async process(ctx: PluginContext): Promise<void> {
    this.ctx = ctx;
    this.changeOperations = [];
    this._replacements = {
      icons: [],
      screenshots: []
    };

    this.processImages('icons');
    this.processImages('screenshots');

    this._hasChanged = Boolean(this.changeOperations.length);

    if (!this._hasChanged) {
      return;
    }

    await Promise.all(this.changeOperations);
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
            this._replacements[key].push(i);
          })
      );
    }
  }

  private async resolveAndReplaceUrl(url: string): Promise<void | string> {
    const resolved = await this.ctx.resolve(url, this.opts.input);
    if (!resolved || resolved.external) {
      return;
    }

    const source = await fs.readFile(resolved.id);

    return this.ctx.emitFile({
      name: `${relative(this.opts.baseDir!, resolved.id)}`,
      source,
      type: 'asset'
    });
  }
}
