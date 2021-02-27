import {promises as fs} from 'fs';
import {ManifestJsonPluginOptions} from '../Options';

/** @internal */
export class InputReader {
  public changed = true;

  private lastProcessedContents: string;

  private lastReadContents: string;

  private readonly replacements: [RegExp, string][];

  public constructor(
    private readonly input: string,
    replacements: ManifestJsonPluginOptions['replace'] | undefined
  ) {
    this.replacements = (!replacements || !replacements.length) ? [] :
      replacements.map(([query, replace]): [RegExp, string] => (
        [typeof query === 'string' ? new RegExp(query, 'g') : query, replace]
      ));
  }

  public async read(): Promise<string> {
    try {
      const contents = await fs.readFile(this.input, 'utf8');
      this.changed = contents !== this.lastReadContents;
      if (this.changed) {
        this.processContents(contents);
      }

      return this.lastProcessedContents;
    } catch (e) {
      this.changed = true;
      throw e;
    }
  }

  private processContents(contents: string): void {
    this.lastReadContents = contents;
    if (this.replacements.length) {
      for (const [reg, replacement] of this.replacements) {
        contents = contents.replace(reg, replacement);
      }
    }
    this.lastProcessedContents = contents;
  }
}
