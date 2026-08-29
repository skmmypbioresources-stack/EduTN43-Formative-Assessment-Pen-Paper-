import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Table as TableIcon,
  Check,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  Info,
} from 'lucide-react';
import { DatasetSpec, TableSpec } from '../types';

interface ScienceGraphViewerProps {
  dataset?: DatasetSpec;
  tableData?: TableSpec;
  stimulusImageUrl?: string;
  isDaylight?: boolean;
  compact?: boolean;
}

const DEFAULT_SERIES_COLORS = [
  '#64748b', // Slate / Grey (e.g. With inhibitor)
  '#16a34a', // Emerald Green (e.g. Without inhibitor)
  '#2563eb', // Royal Blue
  '#d97706', // Amber / Orange
  '#dc2626', // Crimson Red
  '#9333ea', // Violet
  '#0891b2', // Cyan
  '#db2777', // Pink
];

export const ScienceGraphViewer: React.FC<ScienceGraphViewerProps> = ({
  dataset,
  tableData: directTableData,
  stimulusImageUrl,
  isDaylight = true,
  compact = false,
}) => {
  const table = directTableData || dataset?.tableData;
  const hasDataPoints = Boolean(dataset?.dataPoints && dataset.dataPoints.length > 0);

  if (!hasDataPoints && !table && !stimulusImageUrl) {
    return null;
  }

  // Derive series from dataset.series or inspect dataPoints keys
  const seriesList = React.useMemo(() => {
    if (dataset?.series && dataset.series.length > 0) {
      return dataset.series;
    }

    if (!dataset?.dataPoints || dataset.dataPoints.length === 0) {
      return [{ key: 'yVal', name: dataset?.yLabel || 'Value', color: '#2563eb' }];
    }

    const firstPoint = dataset.dataPoints[0];
    if (firstPoint.seriesValues && Object.keys(firstPoint.seriesValues).length > 0) {
      return Object.keys(firstPoint.seriesValues).map((key, idx) => ({
        key,
        name: key,
        color: DEFAULT_SERIES_COLORS[idx % DEFAULT_SERIES_COLORS.length],
      }));
    }

    // Check if extra numeric keys exist on dataPoint object
    const ignoredKeys = new Set(['x', 'label', 'trial1', 'trial2', 'trial3', 'mean', 'seriesValues', 'color']);
    const customKeys = Object.keys(firstPoint).filter(
      (k) => !ignoredKeys.has(k) && typeof firstPoint[k] === 'number'
    );

    if (customKeys.length > 0) {
      return customKeys.map((key, idx) => ({
        key,
        name: key,
        color: DEFAULT_SERIES_COLORS[idx % DEFAULT_SERIES_COLORS.length],
      }));
    }

    return [{ key: 'yVal', name: dataset.yLabel || 'Value', color: '#2563eb' }];
  }, [dataset]);

  const hasMultipleSeries = seriesList.length > 1;

  // Determine if categorical (string labels) or numeric
  const hasStringX = Boolean(
    dataset?.dataPoints?.some((dp) => typeof dp.x === 'string' && isNaN(Number(dp.x)))
  );

  const defaultChartMode = dataset?.chartType || (hasStringX ? 'bar' : 'line');
  const [chartMode, setChartMode] = useState<'bar' | 'line' | 'table' | 'image'>(
    hasDataPoints ? (defaultChartMode === 'line' ? 'line' : 'bar') : table ? 'table' : 'image'
  );
  const [showTable, setShowTable] = useState<boolean>(true);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Transform data for recharts
  const chartData = React.useMemo(() => {
    if (!dataset?.dataPoints) return [];
    return dataset.dataPoints.map((dp, idx) => {
      const item: Record<string, any> = {
        name: String(dp.x),
        x: dp.x,
        trial1: dp.trial1,
        trial2: dp.trial2,
        trial3: dp.trial3,
        mean: dp.mean,
        color: DEFAULT_SERIES_COLORS[idx % DEFAULT_SERIES_COLORS.length],
      };

      if (dp.seriesValues) {
        Object.entries(dp.seriesValues).forEach(([k, v]) => {
          item[k] = Number(v);
        });
      }

      seriesList.forEach((s) => {
        if (item[s.key] === undefined) {
          if (dp[s.key] !== undefined) {
            item[s.key] = Number(dp[s.key]);
          } else if (s.key === 'yVal' || s.key === 'y') {
            item[s.key] = dp.y !== undefined ? Number(dp.y) : Number(dp[s.name] || 0);
          }
        }
      });

      // Default fallback
      if (item.yVal === undefined && dp.y !== undefined) {
        item.yVal = Number(dp.y);
      }

      return item;
    });
  }, [dataset, seriesList]);

  // Calculate Max Y for scale padding
  const maxY = React.useMemo(() => {
    let max = 10;
    chartData.forEach((item) => {
      seriesList.forEach((s) => {
        const val = Number(item[s.key] ?? item.yVal ?? 0);
        if (!isNaN(val) && val > max) max = val;
      });
    });
    return max;
  }, [chartData, seriesList]);

  const yDomain = [0, Math.ceil(maxY * 1.15)];
  const xLabelDisplay = dataset?.xUnit ? `${dataset.xLabel} (${dataset.xUnit})` : dataset?.xLabel || 'X Axis';
  const yLabelDisplay = dataset?.yUnit ? `${dataset.yLabel} (${dataset.yUnit})` : dataset?.yLabel || 'Y Axis';

  const copyTableData = () => {
    let text = '';
    if (table) {
      text += table.headers.join('\t') + '\n';
      table.rows.forEach((row) => {
        text += row.join('\t') + '\n';
      });
    } else if (dataset?.dataPoints) {
      const headers = [xLabelDisplay, ...seriesList.map((s) => s.name)];
      text += headers.join('\t') + '\n';
      chartData.forEach((item) => {
        const row = [item.name, ...seriesList.map((s) => item[s.key] ?? item.yVal ?? '')];
        text += row.join('\t') + '\n';
      });
    }

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isDaylight
          ? 'bg-slate-50/90 border-slate-200 text-slate-900 shadow-xs'
          : 'bg-slate-950/90 border-slate-800 text-slate-100 shadow-xs'
      } ${isExpanded ? 'p-2 fixed inset-4 z-50 overflow-y-auto shadow-2xl bg-white dark:bg-slate-950' : ''}`}
    >
      {/* Header & Controls Bar */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
          isDaylight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-900/70 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200">
            {dataset?.title || table?.title || 'Scientific Data & Experimental Graph'}
          </span>
          {hasMultipleSeries && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700/60">
              {seriesList.length} Series Grouped
            </span>
          )}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {hasDataPoints && (
            <div
              className={`flex items-center p-0.5 rounded-lg border ${
                isDaylight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => setChartMode('bar')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  chartMode === 'bar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDaylight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View as Bar Chart / Grouped Bars"
              >
                <BarChart3 className="w-3 h-3" />
                Bar
              </button>
              <button
                type="button"
                onClick={() => setChartMode('line')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  chartMode === 'line'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDaylight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View as Line Chart"
              >
                <LineChartIcon className="w-3 h-3" />
                Line
              </button>
            </div>
          )}

          {(table || hasDataPoints) && (
            <button
              type="button"
              onClick={() => setShowTable(!showTable)}
              className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                showTable
                  ? isDaylight
                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-slate-800 text-slate-200 border-slate-700'
                  : isDaylight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
              title={showTable ? 'Hide Table View' : 'Show Table View'}
            >
              <TableIcon className="w-3 h-3" />
              {showTable ? 'Table Visible' : 'Show Table'}
            </button>
          )}

          {/* Copy Table Data */}
          <button
            type="button"
            onClick={copyTableData}
            className={`px-2 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all cursor-pointer ${
              isDaylight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
            }`}
            title="Copy Data to Clipboard"
          >
            {copiedToast ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copiedToast ? 'Copied' : 'Copy'}
          </button>

          {/* Maximize Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isDaylight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
            title={isExpanded ? 'Restore Size' : 'Expand Graph'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Description or Context */}
        {dataset?.description && (
          <p className={`text-xs leading-relaxed italic ${isDaylight ? 'text-slate-600' : 'text-slate-400'}`}>
            {dataset.description}
          </p>
        )}

        {/* Visual Graph / Chart Canvas */}
        {hasDataPoints && (
          <div className="w-full">
            <div className={`${isExpanded ? 'h-96' : 'h-60 sm:h-72'} w-full`}>
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 20, right: 25, left: 15, bottom: 25 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDaylight ? '#e2e8f0' : '#334155'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDaylight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      tickLine={false}
                      label={{
                        value: xLabelDisplay,
                        position: 'insideBottom',
                        offset: -15,
                        fill: isDaylight ? '#334155' : '#cbd5e1',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <YAxis
                      stroke={isDaylight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      domain={yDomain}
                      tickLine={false}
                      label={{
                        value: yLabelDisplay,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        fill: isDaylight ? '#334155' : '#cbd5e1',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              className={`p-2.5 rounded-lg border shadow-lg text-xs ${
                                isDaylight
                                  ? 'bg-white border-slate-200 text-slate-800'
                                  : 'bg-slate-900 border-slate-700 text-slate-100'
                              }`}
                            >
                              <div className="font-bold text-slate-900 dark:text-white mb-1.5 border-b pb-1">
                                {xLabelDisplay}: {label}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-xs"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {entry.name}:
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {entry.value} {dataset?.yUnit || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {hasMultipleSeries && (
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                      />
                    )}
                    {seriesList.map((series, sIdx) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        name={series.name}
                        fill={series.color || DEFAULT_SERIES_COLORS[sIdx % DEFAULT_SERIES_COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={hasMultipleSeries ? 35 : 45}
                      >
                        {!hasMultipleSeries &&
                          chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || series.color || DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length]}
                            />
                          ))}
                      </Bar>
                    ))}
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 20, right: 25, left: 15, bottom: 25 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDaylight ? '#e2e8f0' : '#334155'}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDaylight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      label={{
                        value: xLabelDisplay,
                        position: 'insideBottom',
                        offset: -15,
                        fill: isDaylight ? '#334155' : '#cbd5e1',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <YAxis
                      stroke={isDaylight ? '#64748b' : '#94a3b8'}
                      fontSize={11}
                      domain={yDomain}
                      label={{
                        value: yLabelDisplay,
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        fill: isDaylight ? '#334155' : '#cbd5e1',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div
                              className={`p-2.5 rounded-lg border shadow-lg text-xs ${
                                isDaylight
                                  ? 'bg-white border-slate-200 text-slate-800'
                                  : 'bg-slate-900 border-slate-700 text-slate-100'
                              }`}
                            >
                              <div className="font-bold text-slate-900 dark:text-white mb-1.5 border-b pb-1">
                                {xLabelDisplay}: {label}
                              </div>
                              <div className="space-y-1">
                                {payload.map((entry, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {entry.name}:
                                      </span>
                                    </div>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {entry.value} {dataset?.yUnit || ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {hasMultipleSeries && (
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontWeight: 600 }}
                      />
                    )}
                    {seriesList.map((series, sIdx) => (
                      <Line
                        key={series.key}
                        type="monotone"
                        dataKey={series.key}
                        name={series.name}
                        stroke={series.color || DEFAULT_SERIES_COLORS[sIdx % DEFAULT_SERIES_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{
                          r: 4.5,
                          fill: series.color || DEFAULT_SERIES_COLORS[sIdx % DEFAULT_SERIES_COLORS.length],
                          strokeWidth: 2,
                          stroke: '#ffffff',
                        }}
                        activeDot={{ r: 7 }}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Structured Data Table (Either Dedicated Scientific Table or Data Points Table) */}
        {showTable && (
          <div
            className={`rounded-lg border overflow-hidden ${
              isDaylight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            {table ? (
              /* Custom Structured Scientific Table (e.g. Solution | Initial Mass (g) | Final Mass (g)) */
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDaylight
                          ? 'bg-slate-100 text-slate-800 font-bold border-slate-200'
                          : 'bg-slate-800 text-slate-200 font-bold border-slate-700'
                      }`}
                    >
                      {table.headers.map((hdr, hIdx) => (
                        <th key={hIdx} className="p-3 font-bold border-r last:border-r-0 border-slate-200 dark:border-slate-700">
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {table.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={
                          table.highlightedRows?.includes(rIdx)
                            ? isDaylight
                              ? 'bg-blue-50/70 font-semibold text-blue-900'
                              : 'bg-blue-950/40 font-semibold text-blue-200'
                            : isDaylight
                            ? 'hover:bg-slate-50 transition-colors'
                            : 'hover:bg-slate-800/40 transition-colors'
                        }
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-3 border-r last:border-r-0 border-slate-100 dark:border-slate-800 font-mono ${
                              cIdx === 0 ? 'font-sans font-medium text-slate-900 dark:text-slate-100' : ''
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Standard Dataset Table with Multi-Series Columns */
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead>
                    <tr
                      className={`border-b ${
                        isDaylight
                          ? 'bg-slate-100 text-slate-800 font-bold border-slate-200'
                          : 'bg-slate-800 text-slate-200 font-bold border-slate-700'
                      }`}
                    >
                      <th className="p-2.5">{xLabelDisplay}</th>
                      {seriesList.map((series) => (
                        <th key={series.key} className="p-2.5 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: series.color }}
                            />
                            <span>{series.name}</span>
                            {dataset?.yUnit && (
                              <span className="text-[10px] font-normal text-slate-500">
                                ({dataset.yUnit})
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                      {dataset?.dataPoints[0]?.trial1 !== undefined && (
                        <>
                          <th className="p-2.5 font-medium">Trial 1</th>
                          <th className="p-2.5 font-medium">Trial 2</th>
                          <th className="p-2.5 font-medium">Trial 3</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {chartData.map((dp, i) => (
                      <tr
                        key={i}
                        className={
                          isDaylight
                            ? 'hover:bg-slate-50/70 transition-colors'
                            : 'hover:bg-slate-800/40 transition-colors'
                        }
                      >
                        <td className="p-2.5 font-medium flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: dp.color }}
                          />
                          {dp.name}
                        </td>
                        {seriesList.map((series) => (
                          <td key={series.key} className="p-2.5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {dp[series.key] ?? dp.yVal ?? '-'} {dataset?.yUnit || ''}
                          </td>
                        ))}
                        {dp.trial1 !== undefined && (
                          <>
                            <td className="p-2.5 text-slate-500 font-mono">{dp.trial1}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{dp.trial2}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{dp.trial3}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {table?.caption && (
              <div className={`p-2 text-[11px] italic border-t ${isDaylight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                {table.caption}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
