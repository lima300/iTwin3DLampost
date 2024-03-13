/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  IModelConnection,
  readGltfGraphics,
  RenderGraphic,
} from "@itwin/core-frontend";

export async function createGltfGraphic(
  iModel: IModelConnection,
  fileName: string
): Promise<RenderGraphic | undefined> {
  try {
    const url = `/${fileName}.glb`;
    const file = await fetch(url);
    console.log(url, "url");
    const buffer = await file.arrayBuffer();
    let graphic;
    if (iModel) {
      const buff = new Uint8Array(buffer);
      graphic = await readGltfGraphics({
        gltf: buff,
        iModel,
      });
    }
    return graphic;
  } catch (e) {
    console.log("Error occurred!", e);
    return;
  }
}
