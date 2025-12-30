import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { SciChart, type SciChartRef } from "../../src/react/SciChart";
import { detectCycles, generateCycleColors } from "../../src/analysis";

const ReactShowcase = () => {
  const [mode, setMode] = useState<"realtime" | "cv">("realtime");
  const [points, setPoints] = useState(0);

  const chartRef = useRef<SciChartRef>(null);
  const dataRef = useRef({ x: new Float32Array(0), y: new Float32Array(0) });
  const tRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const seriesAddedRef = useRef(false);

  // Real-time data simulation using requestAnimationFrame
  useEffect(() => {
    if (mode !== "realtime") return;

    // Reset data
    dataRef.current = { x: new Float32Array(0), y: new Float32Array(0) };
    tRef.current = 0;
    seriesAddedRef.current = false;
    setPoints(0);

    let lastUpdate = performance.now();
    let lastPointsUpdate = 0;
    const pointsPerFrame = 10;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - lastUpdate;

      if (elapsed >= 16) {
        lastUpdate = now;

        const chart = chartRef.current?.getChart();
        if (!chart) {
          animationRef.current = requestAnimationFrame(animate);
          return;
        }

        const prev = dataRef.current;
        const newX = new Float32Array(prev.x.length + pointsPerFrame);
        const newY = new Float32Array(prev.y.length + pointsPerFrame);
        newX.set(prev.x);
        newY.set(prev.y);

        for (let i = 0; i < pointsPerFrame; i++) {
          const idx = prev.x.length + i;
          newX[idx] = tRef.current;

          // Waveform functions
          const wave1 = () =>
            Math.sin(tRef.current * 0.01) * Math.exp(-tRef.current * 0.005);
          const wave2 = () =>
            Math.sin(tRef.current * 0.01) +
            Math.sin(tRef.current * 0.03) / 3 +
            Math.sin(tRef.current * 0.05) / 5;
          const wave3 = () =>
            ((tRef.current * 0.005) % (2 * Math.PI)) / Math.PI - 1;
          const wave4 = () =>
            Math.sin(tRef.current * 0.01 + Math.sin(tRef.current * 0.001) * 5);
          const wave5 = () =>
            Math.sin(tRef.current * 0.01) * Math.cos(tRef.current * 0.007) +
            Math.sin(tRef.current * 0.023) * 0.5;

          const totalPoints = prev.x.length + i;
          const transitionLength = 2000;

          let signal: number;

          if (totalPoints < 10000) {
            signal = wave1();
          } else if (totalPoints < 10000 + transitionLength) {
            const t = (totalPoints - 10000) / transitionLength;
            signal = wave1() * (1 - t) + wave2() * t;
          } else if (totalPoints < 20000) {
            signal = wave2();
          } else if (totalPoints < 20000 + transitionLength) {
            const t = (totalPoints - 20000) / transitionLength;
            signal = wave2() * (1 - t) + wave3() * t;
          } else if (totalPoints < 30000) {
            signal = wave3();
          } else if (totalPoints < 30000 + transitionLength) {
            const t = (totalPoints - 30000) / transitionLength;
            signal = wave3() * (1 - t) + wave4() * t;
          } else if (totalPoints < 40000) {
            signal = wave4();
          } else if (totalPoints < 40000 + transitionLength) {
            const t = (totalPoints - 40000) / transitionLength;
            signal = wave4() * (1 - t) + wave5() * t;
          } else {
            signal = wave5();
          }

          newY[idx] = signal + Math.random() * 0.1;
          tRef.current += 0.1;
        }

        dataRef.current = { x: newX, y: newY };

        // Update chart directly using imperative API (no React state!)
        if (!seriesAddedRef.current) {
          chart.addSeries({
            id: "live",
            type: "line",
            data: { x: newX, y: newY },
            style: { color: "#00f2ff", width: 1.5 },
          });
          seriesAddedRef.current = true;
        } else {
          chart.updateSeries("live", { x: newX, y: newY });
        }

        // Only update points counter every 100 points to reduce React renders
        if (newX.length - lastPointsUpdate >= 100) {
          lastPointsUpdate = newX.length;
          setPoints(newX.length);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [mode]);

  // CV simulation
  useEffect(() => {
    if (mode !== "cv") return;

    const chart = chartRef.current?.getChart();
    if (!chart) return;

    // Remove realtime series if exists
    const existingSeries = chart.getSeries("live");
    if (existingSeries) {
      chart.removeSeries("live");
    }

    const n = 1000;
    const x = new Float32Array(n);
    const y = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const phase = (i / n) * Math.PI * 4;
      x[i] = Math.sin(phase);
      y[i] = Math.cos(phase) * 0.5 + Math.random() * 0.05;
    }

    dataRef.current = { x, y };

    // Detect cycles for CV mode
    const cycles = detectCycles(x);
    if (cycles.length > 0) {
      const colors = generateCycleColors(cycles.length);
      cycles.forEach((c, i) => {
        chart.addSeries({
          id: `cycle-${c.number}`,
          type: "line",
          data: {
            x: x.slice(c.startIndex, c.endIndex),
            y: y.slice(c.startIndex, c.endIndex),
          },
          style: { color: colors[i], width: 1.5 },
        });
      });
    } else {
      chart.addSeries({
        id: "cv",
        type: "line",
        data: { x, y },
        style: { color: "#ff0055", width: 1.5 },
      });
    }

    setPoints(n);
  }, [mode]);

  const handleModeChange = useCallback((newMode: "realtime" | "cv") => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Clear all series from chart
    const chart = chartRef.current?.getChart();
    if (chart) {
      chart.getAllSeries().forEach((s) => {
        chart.removeSeries(s.getId());
      });
    }

    dataRef.current = { x: new Float32Array(0), y: new Float32Array(0) };
    tRef.current = 0;
    seriesAddedRef.current = false;
    setPoints(0);
    setMode(newMode);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px" }}>
            SciChart React Showcase
          </h1>
          <p style={{ margin: "5px 0 0 0", color: "#888" }}>
            {points.toLocaleString()} points rendered
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => handleModeChange("realtime")}
            style={{
              padding: "8px 16px",
              background: mode === "realtime" ? "#00f2ff" : "#222",
              color: mode === "realtime" ? "#000" : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Real-time
          </button>
          <button
            onClick={() => handleModeChange("cv")}
            style={{
              padding: "8px 16px",
              background: mode === "cv" ? "#00f2ff" : "#222",
              color: mode === "cv" ? "#000" : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cyclic Voltammetry
          </button>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          background: "#000",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #333",
        }}
      >
        <SciChart
          ref={chartRef}
          series={[]} // Empty - we manage series imperatively
          xAxis={{
            label: mode === "realtime" ? "Time (s)" : "Potential (V)",
            auto: true,
          }}
          yAxis={{
            label: mode === "realtime" ? "Signal" : "Current (A)",
            auto: true,
          }}
          height="100%"
          cursor={{ enabled: true, crosshair: true, snap: true }}
          showControls={true}
        />
      </div>

      <footer style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
        Use mouse wheel to zoom, left click and drag to pan, right click and
        drag for box zoom.
      </footer>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactShowcase />
  </React.StrictMode>
);
