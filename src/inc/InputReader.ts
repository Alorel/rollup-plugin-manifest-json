import {BoundClass, BoundMethod} from '@aloreljs/bound-decorator';
import {promises as fs} from 'fs';

/** @internal */
@BoundClass()
export class InputReader {
  public changed = true;

  public lastReadContents: string;

  public constructor(private readonly input: string) {
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
    this.lastReadContents = contents;

    return contents;
  }
}
