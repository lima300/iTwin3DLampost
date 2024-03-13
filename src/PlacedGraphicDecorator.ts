/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import {
  DecorateContext,
  Decorator,
  GraphicBranch,
  GraphicType,
  IModelApp,
  RenderGraphic,
  RenderGraphicOwner,
} from "@itwin/core-frontend";
import { Transform } from "@itwin/core-geometry";

/** A view decoration that draws a graphic created from a glTF asset. */
export class PlacedGraphicDecorator implements Decorator {
  public originalGraphic: RenderGraphic | undefined;
  private _placedGraphic: RenderGraphicOwner[] = [];
  public static instance: PlacedGraphicDecorator | undefined;
  public branch?: GraphicBranch;
  /** Tell the display system not to recreate our graphics every time the mouse cursor moves. */
  public readonly useCachedDecorations = true;
  private constructor() {}
  public static getInstance(): PlacedGraphicDecorator {
    if (!PlacedGraphicDecorator.instance) {
      PlacedGraphicDecorator.instance = new PlacedGraphicDecorator();
    }
    return PlacedGraphicDecorator.instance;
  }

  /** Draw our graphics into the viewport. */
  public decorate(context: DecorateContext): void {
    // Our graphics are defined in spatial coordinates so should only be drawn in a spatial view
    if (context.viewport.view.isSpatialView()) {
      // Produce a "scene" graphic so that it will be affected by lighting and other aspects of the viewport's display style.
      PlacedGraphicDecorator.instance &&
        PlacedGraphicDecorator.instance._placedGraphic?.forEach((graphic) => {
          context.addDecoration(GraphicType.Scene, graphic);
        });
    }
  }

  /** Adding graphic to a branch only once and reusing it until user changes the 3d model from options */
  public changePlacedGraphic(graphic: RenderGraphic) {
    this.originalGraphic = graphic;
    this.branch = new GraphicBranch();
    this.branch.add(this.originalGraphic);
  }

  /**  Update the graphics on the viewport as per transform and save it until it gets destroyed manually */
  public async addPlacedGraphic(transform: Transform): Promise<void> {
    // When we clear graphics everytime, graphic branch will be invalidated so we need to add the original graphic again
    if (
      PlacedGraphicDecorator.instance &&
      PlacedGraphicDecorator.instance.branch &&
      PlacedGraphicDecorator.instance.branch?.entries?.length <= 0
    ) {
      PlacedGraphicDecorator.instance.originalGraphic &&
        PlacedGraphicDecorator.instance.changePlacedGraphic(
          PlacedGraphicDecorator.instance.originalGraphic
        );
    }
    const graphic =
      this.branch &&
      IModelApp.renderSystem.createGraphicBranch(this.branch, transform);
    // Take ownership of the graphic so that it is not disposed of until we're finished with it.
    // By doing so we take responsibility for disposing of it ourselves.
    const owner = graphic && IModelApp.renderSystem.createGraphicOwner(graphic);
    owner && this._placedGraphic.push(owner);
    if (PlacedGraphicDecorator.instance) {
      console.log(PlacedGraphicDecorator.instance);
      IModelApp.viewManager.invalidateCachedDecorationsAllViews(
        PlacedGraphicDecorator.instance
      );
    }
  }

  /**  Delete all the owned graphics on placed decorator */
  public clearGraphics() {
    this._placedGraphic &&
      this._placedGraphic.forEach((owner: RenderGraphicOwner | undefined) => {
        owner?.disposeGraphic();
      });
    this._placedGraphic.length = 0;
    PlacedGraphicDecorator.instance &&
      IModelApp.viewManager.invalidateCachedDecorationsAllViews(
        PlacedGraphicDecorator.instance
      );
  }

  /**  Delete the all placed graphics and remove the decorator */
  public dropDecorator() {
    this.clearGraphics();
    PlacedGraphicDecorator.instance &&
      IModelApp.viewManager.dropDecorator(PlacedGraphicDecorator.instance);
  }
}
