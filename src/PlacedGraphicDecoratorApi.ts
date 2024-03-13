/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelApp } from "@itwin/core-frontend";
import { PlacedGraphicDecorator } from "./PlacedGraphicDecorator";

export default class PlacedGraphicDecoratorApi {
  public static setupDecorator() {
    return PlacedGraphicDecorator.getInstance();
  }

  public static enableDecorations(decorator: PlacedGraphicDecorator) {
    if (!IModelApp.viewManager.decorators.includes(decorator))
      IModelApp.viewManager.addDecorator(decorator);
  }

  public static disableDecorations(decorator: PlacedGraphicDecorator) {
    IModelApp.viewManager.dropDecorator(decorator);
  }
}
