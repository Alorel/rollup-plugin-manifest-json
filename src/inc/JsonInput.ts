import {ImageDef} from './ImageDef';

/** @internal */
export interface JsonInput {
  icons?: ImageDef[];

  screenshots?: ImageDef[];

  [k: string]: any;
}
