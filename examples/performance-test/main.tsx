import React, { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom/client";
import { SciChart, type SciChartRef } from "../../src/react/SciChart";
import { detectCycles, generateCycleColors } from "../../src/analysis";

const PerformanceTest = () => {
  const [pointCount, setPointCount] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    x: new Float32Array(0),
    y: new Float32Array(0),
  });
  const [stats, setStats] = useState({
    fps: 0,
    frameTime: 0,
    points: 0,
    xBounds: [0, 0],
    yBounds: [0, 0],
  });
  const chartRef = useRef<SciChartRef>(null);
  const renderListenerRef = useRef<((e: any) => void) | null>(null);

  const generateData = (n: number) => {
    setIsLoading(true);
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    const cycles = 3;
    const pointsPerCycle = n / cycles;

    for (let i = 0; i < n; i++) {
      const phase = (i / pointsPerCycle) * Math.PI * 2;
      x[i] = Math.sin(phase);
      const baseCurrent = Math.cos(phase) * 0.1;
      const peak1 = Math.exp(-Math.pow(x[i] - 0.5, 2) / 0.01) * 0.05;
      const peak2 = -Math.exp(-Math.pow(x[i] + 0.5, 2) / 0.01) * 0.05;
      const noise = (Math.random() - 0.5) * 0.01;
      y[i] = baseCurrent + peak1 + peak2 + noise;
    }

    setData({ x, y });
    setStats((prev) => ({ ...prev, points: n }));
    setIsLoading(false);
  };

  const cycles = useMemo(() => {
    if (data.x.length === 0) return [];
    return detectCycles(data.x);
  }, [data]);

  const series = useMemo(() => {
    if (data.x.length === 0) return [];
    if (cycles.length === 0) return [];

    return [{ id: "data", x: data.x, y: data.y, color: "#ff00ff" }];
  }, [data, cycles]);

  // Register render event listener - only once when chart is ready
  useEffect(() => {
    const chart = chartRef.current?.getChart();
    if (!chart || series.length === 0) {
      return;
    }

    // Create the handler function
    const handleRender = (renderData: { fps: number; frameTime: number }) => {
      const bounds = chart.getViewBounds();
      setStats((prev) => ({
        ...prev,
        fps: Math.round(renderData.fps),
        frameTime: renderData.frameTime,
        xBounds: [bounds.xMin, bounds.xMax],
        yBounds: [bounds.yMin, bounds.yMax],
      }));
    };

    // Store the handler reference so we can remove it later
    renderListenerRef.current = handleRender;

    // Register the listener
    chart.on("render", handleRender);

    // Cleanup function
    return () => {
      if (renderListenerRef.current) {
        chart.off("render", renderListenerRef.current);
        renderListenerRef.current = null;
      }
    };
  }, [series.length]); // Only re-register when series length changes

  const pointOptions = [
    { label: "1k", value: 1000 },
    { label: "10k", value: 10000 },
    { label: "50k", value: 50000 },
    { label: "100k", value: 100000 },
    { label: "1M", value: 1000000 },
    { label: "5M", value: 5000000 },
    { label: "10M", value: 10000000 },
  ];

  const fpsColor =
    stats.fps >= 55 ? "#3fb950" : stats.fps >= 30 ? "#d29922" : "#f85149";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        background: "#0b0e14",
        color: "#c9d1d9",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header with controls */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        {/* Point count buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px", color: "#8b949e" }}>Points:</span>
          {pointOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setPointCount(option.value);
                generateData(option.value);
              }}
              style={{
                padding: "6px 12px",
                background: pointCount === option.value ? "#f85149" : "#21262d",
                color: pointCount === option.value ? "white" : "#c9d1d9",
                border: "1px solid #30363d",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Regenerate button */}
        <button
          onClick={() => generateData(pointCount)}
          style={{
            padding: "6px 16px",
            background: "#1f6feb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          🔄 Regenerate
        </button>

        {/* Reset zoom button */}
        <button
          onClick={() => chartRef.current?.getChart()?.resetZoom()}
          style={{
            padding: "6px 16px",
            background: "#21262d",
            color: "#c9d1d9",
            border: "1px solid #30363d",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: "600",
          }}
        >
          🔍 Reset Zoom
        </button>
      </header>

      {/* Chart container */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: "#0d1117",
          border: "1px solid #30363d",
          borderRadius: "8px",
          position: "relative",
        }}
      >
        <SciChart
          ref={chartRef}
          xAxis={{ scale: "linear", label: "E / V", auto: true }}
          yAxis={{ scale: "linear", label: "I / A", auto: true }}
          background="#0d1117"
          theme="midnight"
          showLegend={true}
          showControls={true}
          series={series}
        />
      </div>

      {/* Stats footer */}
      <div
        style={{
          marginTop: "15px",
          padding: "12px 20px",
          background: "#161b22",
          border: "1px solid #30363d",
          borderRadius: "8px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontFamily: "monospace",
          color: "#8b949e",
        }}
      >
        <span>
          📊 Stats: <b>{stats.points.toLocaleString()}</b> points
        </span>
        <span>|</span>
        <span style={{ color: fpsColor }}>
          🚀 <b>{stats.fps.toFixed(0)} FPS</b>
        </span>
        <span>|</span>
        <span style={{ color: "#c9d1d9" }}>
          ⏱️ <b>{stats.frameTime.toFixed(1)} ms</b>/frame
        </span>
        <span>|</span>
        <span style={{ color: "#58a6ff" }}>
          X: [{stats.xBounds[0].toFixed(3)}, {stats.xBounds[1].toFixed(3)}]
        </span>
        <span>|</span>
        <span style={{ color: "#58a6ff" }}>
          Y: [{stats.yBounds[0].toExponential(2)},{" "}
          {stats.yBounds[1].toExponential(2)}]
        </span>
      </div>
    </div>
  );
};

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<PerformanceTest />);

// Generate initial data
setTimeout(() => {
  const app = document.getElementById("root");
  if (app) {
    // Trigger initial data generation by finding the component
    const buttons = document.querySelectorAll("button");
    if (buttons.length > 0) {
      (buttons[0] as HTMLButtonElement).click();
    }
  }
}, 100);
