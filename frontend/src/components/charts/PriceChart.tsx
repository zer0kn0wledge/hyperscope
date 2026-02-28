'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import { CHART_COLORS } from '@/lib/constants';
import type { CandleData } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

interface PriceChartProps {
  data: CandleData[];
  isLoading?: boolean;
  height?: number;
  showVolume?: boolean;
}

export function PriceChart({
  data,
  isLoading,
  height = 400,
  showVolume = true,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [crosshairData, setCrosshairData] = useState<{
    time?: string;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: showVolume ? height - 80 : height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: CHART_COLORS.text,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid, style: 0 },
        horzLines: { color: CHART_COLORS.grid, style: 0 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(0, 209, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A0F1A',
        },
        horzLine: {
          color: 'rgba(0, 209, 255, 0.4)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A0F1A',
        },
      },
      timeScale: {
        borderColor: CHART_COLORS.grid,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: CHART_COLORS.grid,
        scaleMargins: { top: 0.1, bottom: showVolume ? 0.25 : 0.1 },
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: CHART_COLORS.cyan,
      downColor: CHART_COLORS.red,
      borderUpColor: CHART_COLORS.cyan,
      borderDownColor: CHART_COLORS.red,
      wickUpColor: CHART_COLORS.cyan,
      wickDownColor: CHART_COLORS.red,
    });
    candleSeriesRef.current = candleSeries;

    // Volume series
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: 'rgba(0, 209, 255, 0.3)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // Crosshair subscription
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setCrosshairData(null);
        return;
      }
      const candle = param.seriesData.get(candleSeries) as CandlestickData | undefined;
      if (candle) {
        setCrosshairData({
          time: new Date(Number(param.time) * 1000).toLocaleDateString(),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      }
    });

    // Resize observer
    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [height, showVolume]);

  // Update data
  useEffect(() => {
    if (!data || !candleSeriesRef.current) return;

    const candleData: CandlestickData[] = data.map((d) => ({
      time: (d.time / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeriesRef.current.setData(candleData);

    if (volumeSeriesRef.current) {
      const volumeData = data.map((d) => ({
        time: (d.time / 1000) as Time,
        value: d.volume,
        color: d.close >= d.open
          ? 'rgba(0, 209, 255, 0.3)'
          : 'rgba(255, 77, 106, 0.3)',
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    chartRef.current?.timeScale().fitContent();
  }, [data]);

  if (isLoading) {
    return <Skeleton className="rounded-xl" style={{ height }} />;
  }

  return (
    <div className="relative">
      {/* Crosshair OHLC display */}
      {crosshairData && (
        <div className="absolute top-2 left-2 z-10 flex gap-3 text-xs number bg-bg-elevated/80 px-2 py-1 rounded border border-border-subtle">
          {crosshairData.open !== undefined && (
            <>
              <span className="text-text-tertiary">O <span className="text-text-secondary">{crosshairData.open?.toFixed(2)}</span></span>
              <span className="text-text-tertiary">H <span className="text-accent-green">{crosshairData.high?.toFixed(2)}</span></span>
              <span className="text-text-tertiary">L <span className="text-accent-red">{crosshairData.low?.toFixed(2)}</span></span>
              <span className="text-text-tertiary">C <span className="text-text-primary">{crosshairData.close?.toFixed(2)}</span></span>
            </>
          )}
        </div>
      )}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
