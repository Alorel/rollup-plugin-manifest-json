import {promises as fs} from 'fs';
import {relative} from 'path';
import {PluginContext} from 'rollup';
import {ManifestJsonPluginOptions} from '../Options';
import {noop} from './noop';
import {ContentScriptType, ReplacedKeys} from './ReplacedKeys';

/** @internal */
export class Renderer {
  public hasChanged = false;

  public readonly replacedKeys: ReplacedKeys = {
    contentScripts: [],
    icons: []
  };

  private readonly changeOperations: Promise<any>[] = [];

  private ctx: PluginContext;

  public constructor(
    public readonly json: { [k: string]: any },
    private readonly opts: ManifestJsonPluginOptions
  ) {
  }

  public process(ctx: PluginContext): Promise<void> {
    this.ctx = ctx;
    this.processIcons();
    this.processContentScripts();

    if (this.changeOperations.length) {
      this.hasChanged = true;

      return Promise.all(this.changeOperations).then(noop);
    } else {
      this.hasChanged = false;

      return Promise.resolve();
    }
  }

  private processContentScripts(): void {
    const scripts: any[] = this.json.content_scripts;
    if (!scripts) {
      return;
    }

    const types: ContentScriptType[] = ['js', 'css'];

    for (let scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++) {
      const script = scripts[scriptIndex];

      for (const type of types) {
        const section: string[] = script[type];
        if (!section) {
          continue;
        }

        for (let sectionIndex = 0; sectionIndex < section.length; sectionIndex++) {
          const url = section[sectionIndex];

          this.changeOperations.push(
            this.resolveAndReplaceUrl(url)
              .then(assetId => {
                if (!assetId) {
                  return;
                }

                section[scriptIndex] = assetId;
                this.replacedKeys.contentScripts.push({
                  scriptIndex,
                  sectionIndex,
                  type
                });
              })
          );
        }
      }
    }
  }

  private processIcons(): void {
    if (!this.json.icons) {
      return;
    }

    for (const [key, url] of Object.entries(this.json.icons as { [k: string]: string })) {
      this.changeOperations.push(
        this.resolveAndReplaceUrl(url)
          .then(assetId => {
            if (!assetId) {
              return;
            }

            this.json.icons[key] = assetId;
            this.replacedKeys.icons.push(key);
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
