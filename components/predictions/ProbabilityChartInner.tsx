"use client";

import { useEffect, useRef, useCallback } from "react";
import { createChart, ColorType, LineSeries, HistogramSeries } from "lightweight-charts";
import { PricePoint } from "@/types/predictions";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  data: PricePoint[];
  color: string;
}

export default function ProbabilityChartInner({ data, color }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const getThemeColors = useCallback(() => {
    if (theme === "light") {
      return {
        background: "#f8f9fc",
        textColor: "#9a9daa",
        gridColor: "#d0d4e0",
        crosshairColor: "#5a5d70",
      };
    }
    return {
      background: "#0c0f14",
      textColor: "#5a5d70",
      gridColor: "#424654",
      crosshairColor: "#8a8da0",
    };
  }, [theme]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getThemeColors();

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: colors.crosshairColor, width: 1, style: 2 },
        horzLine: { color: colors.crosshairColor, width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const lineSeries = chart.addSeries(LineSeries, {
      color: color,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: true,
      priceLineColor: color,
      priceLineStyle: 2,
    });

    const formattedLine = data.map((d) => ({
      time: d.time as unknown as string,
      value: d.value,
    }));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "rgba(0, 192, 118, 0.25)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const formattedVol = data
      .filter((d) => d.volume)
      .map((d) => ({
        time: d.time as unknown as string,
        value: d.volume!,
        color: "rgba(0, 192, 118, 0.2)",
      }));

    lineSeries.setData(formattedLine);
    volumeSeries.setData(formattedVol);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, color, theme, getThemeColors]);

  return <div ref={chartContainerRef} className="w-full h-[300px]" />;
}
