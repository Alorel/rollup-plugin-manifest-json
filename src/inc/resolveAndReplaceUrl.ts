import {promises as fs} from 'fs';
import {relative} from 'path';
import {PluginContext} from 'rollup';

/** @internal */
export async function resolveAndReplaceUrl(
  emittedAssetIds: string[],
  ctx: PluginContext,
  baseDir: string,
  url: string,
  input: string
): Promise<void | string> {
  const resolved = await ctx.resolve(url, input);
  if (!resolved || resolved.external) {
    return;
  }

  const assetId = ctx.emitFile({
    name: `${relative(baseDir, resolved.id)}`,
    source: await fs.readFile(resolved.id),
    type: 'asset'
  });
  emittedAssetIds.push(assetId);

  return assetId;
}
