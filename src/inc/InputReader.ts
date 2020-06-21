import {BoundClass, BoundMethod} from '@aloreljs/bound-decorator';
import {promises as fs} from 'fs';
import {ManifestJsonPluginOptions} from '../Options';

/** @internal */
@BoundClass()
export class InputReader {
  public changed = true;

  private lastProcessedContents: string;

  private lastReadContents: string;

  public constructor(
    private readonly input: string,
    private readonly replacements: ManifestJsonPluginOptions['replace'] | undefined
  ) {
  }

  public read(): Promise<string> {
    return fs.readFile(this.input, 'utf8')
      .then(this.onReadSuccess, this.onReadError); //tslint:disable-line:no-unbound-method
  }

  @BoundMethod()
  private onReadError(e: Error): never {
    this.changed = true;
    throw e;
  }

  @BoundMethod()
  private onReadSuccess(contents: string): string {
    this.changed = contents !== this.lastReadContents;

    if (this.changed) {
      this.processContents(contents);
    }

    return this.lastProcessedContents;
  }

  private processContents(contents: string): void {
    this.lastReadContents = contents;
    if (this.replacements?.length) {
      for (const [reg, replacement] of this.replacements) {
        contents = contents.replace(reg, replacement);
      }
    }
    this.lastProcessedContents = contents;
  }
}
