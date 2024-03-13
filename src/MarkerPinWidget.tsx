/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React, { useCallback, useEffect } from "react";
import {
  StagePanelLocation,
  StagePanelSection,
  UiItemsProvider,
  useActiveViewport,
  Widget,
  WidgetState,
} from "@itwin/appui-react";
import {
  AccuDrawHintBuilder,
  ScreenViewport,
  Viewport,
} from "@itwin/core-frontend";
import { Point3d, Range2d, Transform } from "@itwin/core-geometry";
import { ToggleSwitch } from "@itwin/itwinui-react";
import HeatmapDecorator from "./HeatmapDecorator";
import HeatmapDecoratorApi from "./HeatmapDecoratorApi";
import { PlacedGraphicDecorator } from "./PlacedGraphicDecorator";
import PlacedGraphicDecoratorApi from "./PlacedGraphicDecoratorApi";
import { createGltfGraphic } from "./utils";
import coordinates from "./assets/coordinates.json";

const MarkerPinWidget = () => {
  const viewport = useActiveViewport();

  const [showDecoratorState, setShowDecoratorState] =
    React.useState<boolean>(true);
  const [rangeState, setRangeState] = React.useState<Range2d>(
    Range2d.createNull()
  );
  const [heightState, setHeightState] = React.useState<number>(0);

  const [spreadFactorState] = React.useState<number>(1);
  const [pointsState, setPointsState] = React.useState<Point3d[]>([]);

  const [heatmapDecorator] = React.useState<HeatmapDecorator>(() => {
    return HeatmapDecoratorApi.setupDecorator();
  });

  const [placedGraphicDecorator] = React.useState<PlacedGraphicDecorator>(
    () => {
      return PlacedGraphicDecoratorApi.setupDecorator();
    }
  );

  useEffect(() => {
    PlacedGraphicDecoratorApi.enableDecorations(placedGraphicDecorator);
    return () => {
      PlacedGraphicDecoratorApi.disableDecorations(placedGraphicDecorator);
    };
  }, [placedGraphicDecorator]);

  const viewInit = useCallback((vp: ScreenViewport) => {
    // Grab range of the contents of the view. We'll use this to position the random markers.
    const range3d = vp.view.computeFitRange();
    const range = Range2d.createFrom(range3d);

    // We'll draw the heatmap as an overlay in the center of the view's Z extents.
    // const height = range3d.high.interpolate(0.5, range3d.low).z;

    setRangeState(range);
    setHeightState(-5.099571943283081);
  }, []);

  /** When the images are loaded, initialize the MarkerPin */
  useEffect(() => {
    if (viewport) {
      viewInit(viewport);
    }
  }, [viewInit, viewport]);

  const addGraphicToDecorators = useCallback(
    async (fileName: string = "Streetlights") => {
      if (!viewport?.iModel) return;
      const graphic = await createGltfGraphic(viewport?.iModel, fileName);
      if (graphic) {
        placedGraphicDecorator.changePlacedGraphic(graphic);
      }
    },
    [placedGraphicDecorator, viewport?.iModel]
  );

  useEffect(() => {
    addGraphicToDecorators().then(() => {
      coordinates.coordinates.forEach(({ x, y, z }) => {
        const point = new Point3d(x, y, z);
        const transform = Transform.createOriginAndMatrix(
          point,
          AccuDrawHintBuilder.getCurrentRotation(
            viewport as Viewport,
            true,
            true
          )
        );
        placedGraphicDecorator?.addPlacedGraphic(transform);
        setPointsState([...pointsState, point]);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addGraphicToDecorators, placedGraphicDecorator, viewport]);

  useEffect(() => {
    heatmapDecorator.setHeight(heightState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heightState]);

  useEffect(() => {
    heatmapDecorator.setRange(rangeState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeState]);

  // Effect when the points get updated
  useEffect(() => {
    heatmapDecorator.setPoints(pointsState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsState]);

  useEffect(() => {
    heatmapDecorator.setSpreadFactor(spreadFactorState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadFactorState]);

  useEffect(() => {
    if (showDecoratorState)
      HeatmapDecoratorApi.enableDecorations(heatmapDecorator);
    else HeatmapDecoratorApi.disableDecorations(heatmapDecorator);
  }, [heatmapDecorator, showDecoratorState]);

  // Display drawing and sheet options in separate sections.
  return (
    <div className="sample-options">
      <ToggleSwitch
        className="show-markers"
        label="Show markers"
        labelPosition="right"
        checked={showDecoratorState}
        onChange={() => setShowDecoratorState(!showDecoratorState)}
      />
    </div>
  );
};

export class MarkerPinWidgetProvider implements UiItemsProvider {
  public readonly id: string = "MarkerPinWidgetProvider";

  public provideWidgets(
    _stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _section?: StagePanelSection
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push({
        id: "MarkerPinWidget",
        label: "Marker Pin Selector",
        defaultState: WidgetState.Open,
        content: <MarkerPinWidget />,
      });
    }
    return widgets;
  }
}
