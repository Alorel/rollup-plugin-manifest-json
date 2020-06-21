/** @internal */
export type ContentScriptType = 'js' | 'css';

/** @internal */
export interface ContentScriptReplacement {
  scriptIndex: number;

  sectionIndex: number;

  type: ContentScriptType;
}

/** @internal */
export interface ReplacedKeys {
  contentScripts: ContentScriptReplacement[];

  icons: string[];
}
