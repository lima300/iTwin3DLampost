/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import React, { useCallback, useEffect, useState } from "react";
import { UiFramework } from "@itwin/appui-react";
import {
  IModelApp,
  IModelConnection,
  StandardViewId,
} from "@itwin/core-frontend";
import { Viewer, ViewerViewportControlOptions } from "@itwin/web-viewer-react";
import { authClient } from "./common/AuthorizationClient";
import { mapLayerOptions } from "./common/MapLayerOptions";
import { ViewSetup } from "./common/ViewSetup";
import { MarkerPinWidgetProvider } from "./MarkerPinWidget";
import { PlacedGraphicDecorator } from "./PlacedGraphicDecorator";

const uiProviders = [new MarkerPinWidgetProvider()];
const viewportOptions: ViewerViewportControlOptions = {
  viewState: async (iModelConnection) => {
    const viewState = await ViewSetup.getDefaultView(iModelConnection);

    // The marker pins look better in a top view
    viewState.setStandardRotation(StandardViewId.Top);

    const range = viewState.computeFitRange();
    const aspect = viewState.getAspectRatio();

    viewState.lookAtVolume(range, aspect);
    return viewState;
  },
};

const iTwinId = process.env.IMJS_ITWIN_ID;
const iModelId = process.env.IMJS_IMODEL_ID;

const MarkerPinApp = () => {
  /** Sign-in */
  useEffect(() => {
    void authClient.signIn();
  }, []);

  const handleAppInit = () => {
    IModelApp.viewManager.addDecorator(PlacedGraphicDecorator.getInstance());
  };

  const [iModels, setIModel] = useState<IModelConnection>();

  const handleIModelConnected = useCallback(
    (iModel: IModelConnection) => {
      if (!iModels) setIModel(iModel);
    },
    [iModels]
  );

  /** The sample's render method */
  return (
    <Viewer
      iTwinId={iTwinId ?? ""}
      iModelId={iModelId ?? ""}
      authClient={authClient}
      viewportOptions={viewportOptions}
      mapLayerOptions={mapLayerOptions}
      uiProviders={uiProviders}
      defaultUiConfig={{
        hideStatusBar: true,
        hideToolSettings: true,
      }}
      enablePerformanceMonitors={false}
      theme={process.env.THEME ?? "dark"}
      onIModelAppInit={handleAppInit}
      onIModelConnected={handleIModelConnected}
    />
  );
};

// Define panel size
UiFramework.frontstages.onFrontstageReadyEvent.addListener((event) => {
  const { bottomPanel } = event.frontstageDef;
  bottomPanel && (bottomPanel.size = 250);
});

export default MarkerPinApp;
