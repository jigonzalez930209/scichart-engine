/**
 * Chart Series Types
 */
import { Series } from "../../Series";
import { NativeWebGLRenderer } from "../../../renderer";
import { Bounds } from "../../../types";
import { Annotation } from "../../annotations";

export interface SeriesManagerContext {
  series: Map<string, Series>;
  renderer: NativeWebGLRenderer;
  viewBounds: Bounds;
  autoScale: () => void;
  requestRender: () => void;
  addAnnotation: (annotation: Annotation) => string;
  xAxisOptions: { auto?: boolean };
  yAxisOptionsMap: Map<string, { auto?: boolean }>;
  autoScrollEnabled: boolean;
  updateLegend?: () => void;
  addSeries: (options: any) => void;
}
