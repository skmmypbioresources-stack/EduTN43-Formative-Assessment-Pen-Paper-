import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  BarChart3,
  Table as TableIcon,
  Sparkles,
  Check,
  RotateCcw,
  Palette,
  Eye,
} from 'lucide-react';
import { DatasetSpec, TableSpec, DataSeries, DataPoint } from '../types';
import { ScienceGraphViewer } from './ScienceGraphViewer';

interface DataAndGraphEditorModalProps {
  initialDataset?: DatasetSpec;
  initialTableData?: TableSpec;
  onSave: (dataset?: DatasetSpec, tableData?: TableSpec) => void;
  onClose: () => void;
}

const PRESET_EXAMPLES = [
  {
    id: 'sodium_uptake',
    name: 'Sodium Uptake by Root Cells (With & Without Inhibitor)',
    category: 'Cell Transport & Active Transport',
    dataset: {
      title: 'Sodium Uptake by Root Cells',
      chartType: 'bar' as const,
      description: 'Effect of metabolic inhibitor on sodium uptake across increasing external sodium concentrations.',
      xLabel: 'External Sodium Concentration',
      xUnit: 'mmol/L',
      yLabel: 'Sodium Uptake',
      yUnit: 'arbitrary units',
      series: [
        { key: 'withInhibitor', name: 'With inhibitor', color: '#6b7280' },
        { key: 'withoutInhibitor', name: 'Without inhibitor', color: '#15803d' },
      ],
      dataPoints: [
        { x: '0', withInhibitor: 1.0, withoutInhibitor: 1.0 },
        { x: '1', withInhibitor: 3.0, withoutInhibitor: 6.0 },
        { x: '5', withInhibitor: 4.0, withoutInhibitor: 14.0 },
        { x: '10', withInhibitor: 4.0, withoutInhibitor: 19.0 },
      ],
    },
    tableData: {
      title: 'Sodium Uptake Rates in Barley Root Cells',
      headers: ['External Sodium Conc. (mmol/L)', 'With Inhibitor (a.u.)', 'Without Inhibitor (a.u.)'],
      rows: [
        ['0', '1.0', '1.0'],
        ['1', '3.0', '6.0'],
        ['5', '4.0', '14.0'],
        ['10', '4.0', '19.0'],
      ],
      caption: 'Data recorded after 60 minutes exposure at 22°C.',
    },
  },
  {
    id: 'potato_osmosis',
    name: 'Osmosis in Plant Tissue (Mass Change in Solutions)',
    category: 'Osmosis & Water Potential',
    dataset: {
      title: 'Mass Change of Plant Tissue in Solutions',
      chartType: 'bar' as const,
      description: 'Initial vs. final mass of potato cylinders in various solute concentrations.',
      xLabel: 'Solution',
      yLabel: 'Mass',
      yUnit: 'g',
      series: [
        { key: 'initialMass', name: 'Initial Mass (g)', color: '#2563eb' },
        { key: 'finalMass', name: 'Final Mass (g)', color: '#16a34a' },
      ],
      dataPoints: [
        { x: 'Pure water', initialMass: 5.0, finalMass: 6.0 },
        { x: 'Dilute salt solution', initialMass: 5.0, finalMass: 5.1 },
        { x: 'Concentrated solution', initialMass: 5.0, finalMass: 4.2 },
      ],
    },
    tableData: {
      title: 'Investigation into Osmosis in Potato Tissue',
      headers: ['Solution', 'Initial Mass (g)', 'Final Mass (g)'],
      rows: [
        ['Pure water', '5.0', '6.0'],
        ['Dilute salt solution', '5.0', '5.1'],
        ['Concentrated solution', '5.0', '4.2'],
      ],
      caption: 'Initial mass measured to nearest 0.1 g; cylinders immersed for 30 minutes.',
    },
  },
  {
    id: 'enzyme_temperature',
    name: 'Enzyme Activity vs. Temperature (Amylase)',
    category: 'Enzymes & Catalysis',
    dataset: {
      title: 'Rate of Starch Breakdown vs. Temperature',
      chartType: 'line' as const,
      description: 'Activity curve showing optimal temperature and thermal denaturation.',
      xLabel: 'Temperature',
      xUnit: '°C',
      yLabel: 'Rate of Reaction',
      yUnit: 'arbitrary units',
      series: [{ key: 'rate', name: 'Reaction Rate', color: '#dc2626' }],
      dataPoints: [
        { x: '10', rate: 1.2 },
        { x: '20', rate: 2.8 },
        { x: '30', rate: 5.6 },
        { x: '40', rate: 9.8 },
        { x: '50', rate: 7.1 },
        { x: '60', rate: 1.4 },
        { x: '70', rate: 0.0 },
      ],
    },
    tableData: {
      title: 'Enzyme Kinetic Rate Across Temperatures',
      headers: ['Temperature (°C)', 'Reaction Rate (a.u.)', 'Time to Completion (s)'],
      rows: [
        ['10', '1.2', '180'],
        ['20', '2.8', '95'],
        ['30', '5.6', '45'],
        ['40', '9.8', '22'],
        ['50', '7.1', '35'],
        ['60', '1.4', '160'],
        ['70', '0.0', 'No reaction'],
      ],
    },
  },
];

export const DataAndGraphEditorModal: React.FC<DataAndGraphEditorModalProps> = ({
  initialDataset,
  initialTableData,
  onSave,
  onClose,
}) => {
  const [mode, setMode] = useState<'dataset' | 'table'>('dataset');

  // Dataset state
  const [title, setTitle] = useState<string>(initialDataset?.title || 'Sodium Uptake by Root Cells');
  const [description, setDescription] = useState<string>(initialDataset?.description || '');
  const [chartType, setChartType] = useState<'bar' | 'line'>(initialDataset?.chartType === 'line' ? 'line' : 'bar');
  const [xLabel, setXLabel] = useState<string>(initialDataset?.xLabel || 'External Sodium Concentration');
  const [xUnit, setXUnit] = useState<string>(initialDataset?.xUnit || 'mmol/L');
  const [yLabel, setYLabel] = useState<string>(initialDataset?.yLabel || 'Sodium Uptake');
  const [yUnit, setYUnit] = useState<string>(initialDataset?.yUnit || 'arbitrary units');

  // Series state
  const [seriesList, setSeriesList] = useState<DataSeries[]>(
    initialDataset?.series && initialDataset.series.length > 0
      ? initialDataset.series
      : [
          { key: 'withInhibitor', name: 'With inhibitor', color: '#6b7280' },
          { key: 'withoutInhibitor', name: 'Without inhibitor', color: '#15803d' },
        ]
  );

  // DataPoints state
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(
    initialDataset?.dataPoints && initialDataset.dataPoints.length > 0
      ? initialDataset.dataPoints
      : [
          { x: '0', withInhibitor: 1.0, withoutInhibitor: 1.0 },
          { x: '1', withInhibitor: 3.0, withoutInhibitor: 6.0 },
          { x: '5', withInhibitor: 4.0, withoutInhibitor: 14.0 },
          { x: '10', withInhibitor: 4.0, withoutInhibitor: 19.0 },
        ]
  );

  // Table state
  const [tableHeaders, setTableHeaders] = useState<string[]>(
    initialTableData?.headers || ['Solution', 'Initial Mass (g)', 'Final Mass (g)']
  );
  const [tableRows, setTableRows] = useState<(string | number)[][]>(
    initialTableData?.rows || [
      ['Pure water', '5.0', '6.0'],
      ['Dilute salt solution', '5.0', '5.1'],
      ['Concentrated solution', '5.0', '4.2'],
    ]
  );
  const [tableCaption, setTableCaption] = useState<string>(initialTableData?.caption || '');

  // Add series
  const handleAddSeries = () => {
    const newKey = `series_${Date.now()}`;
    const newSeries: DataSeries = {
      key: newKey,
      name: `Series ${seriesList.length + 1}`,
      color: '#2563eb',
    };
    setSeriesList([...seriesList, newSeries]);
    setDataPoints(
      dataPoints.map((dp) => ({
        ...dp,
        [newKey]: 0,
      }))
    );
  };

  const handleRemoveSeries = (keyToRemove: string) => {
    if (seriesList.length <= 1) return;
    setSeriesList(seriesList.filter((s) => s.key !== keyToRemove));
  };

  // Add Data Point Row
  const handleAddDataPoint = () => {
    const newDp: DataPoint = { x: `Category ${dataPoints.length + 1}` };
    seriesList.forEach((s) => {
      newDp[s.key] = 0;
    });
    setDataPoints([...dataPoints, newDp]);
  };

  const handleRemoveDataPoint = (idx: number) => {
    if (dataPoints.length <= 1) return;
    setDataPoints(dataPoints.filter((_, i) => i !== idx));
  };

  // Table Column Handlers
  const handleAddTableColumn = () => {
    const newHeader = `Column ${tableHeaders.length + 1}`;
    setTableHeaders([...tableHeaders, newHeader]);
    setTableRows(tableRows.map((r) => [...r, '-']));
  };

  const handleRemoveTableColumn = (idx: number) => {
    if (tableHeaders.length <= 1) return;
    setTableHeaders(tableHeaders.filter((_, i) => i !== idx));
    setTableRows(tableRows.map((r) => r.filter((_, i) => i !== idx)));
  };

  const handleAddTableRow = () => {
    const newRow = tableHeaders.map((_, i) => (i === 0 ? `Row ${tableRows.length + 1}` : '0.0'));
    setTableRows([...tableRows, newRow]);
  };

  const handleRemoveTableRow = (idx: number) => {
    if (tableRows.length <= 1) return;
    setTableRows(tableRows.filter((_, i) => i !== idx));
  };

  // Apply Preset
  const handleApplyPreset = (preset: (typeof PRESET_EXAMPLES)[0]) => {
    setTitle(preset.dataset.title);
    setDescription(preset.dataset.description);
    setChartType(preset.dataset.chartType);
    setXLabel(preset.dataset.xLabel);
    setXUnit(preset.dataset.xUnit || '');
    setYLabel(preset.dataset.yLabel);
    setYUnit(preset.dataset.yUnit || '');
    setSeriesList(preset.dataset.series);
    setDataPoints(preset.dataset.dataPoints);

    if (preset.tableData) {
      setTableHeaders(preset.tableData.headers);
      setTableRows(preset.tableData.rows);
      setTableCaption(preset.tableData.caption || '');
    }
  };

  const constructDataset = (): DatasetSpec => ({
    title,
    description: description.trim() || undefined,
    chartType,
    xLabel,
    xUnit: xUnit.trim() || undefined,
    yLabel,
    yUnit: yUnit.trim() || undefined,
    series: seriesList,
    dataPoints,
  });

  const constructTable = (): TableSpec => ({
    title,
    headers: tableHeaders,
    rows: tableRows,
    caption: tableCaption.trim() || undefined,
  });

  const handleSaveAll = () => {
    const finalDataset = constructDataset();
    const finalTable = constructTable();
    onSave(finalDataset, finalTable);
  };

  const previewDataset = constructDataset();
  const previewTable = constructTable();

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Science Data, Graph & Table Editor
              </h3>
              <p className="text-xs text-slate-500">
                100% exact numerical data, multi-series grouped bar charts, and scientific tables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset quick picker */}
        <div className="px-5 py-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 dark:text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Authentic Science Preset:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_EXAMPLES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-colors"
              >
                {preset.name.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs & Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Editor Mode Selector */}
          <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('dataset')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'dataset'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Multi-Series Graph & Values
              </button>
              <button
                type="button"
                onClick={() => setMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'table'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                Structured Scientific Table
              </button>
            </div>
            <span className="text-xs font-medium text-slate-500">Live preview active below</span>
          </div>

          {mode === 'dataset' ? (
            /* Graph & Multi-Series Data Points Form */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Graph Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. Sodium Uptake by Root Cells"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value as any)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="bar">Grouped Bar Chart</option>
                    <option value="line">Multi-Series Line Chart</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Description / Context</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="Optional experimental details"
                  />
                </div>
              </div>

              {/* Axes Labels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">X-Axis Label</label>
                  <input
                    type="text"
                    value={xLabel}
                    onChange={(e) => setXLabel(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. External Sodium Concentration"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">X-Axis Unit</label>
                  <input
                    type="text"
                    value={xUnit}
                    onChange={(e) => setXUnit(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. mmol/L"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Y-Axis Label</label>
                  <input
                    type="text"
                    value={yLabel}
                    onChange={(e) => setYLabel(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. Sodium Uptake"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Y-Axis Unit</label>
                  <input
                    type="text"
                    value={yUnit}
                    onChange={(e) => setYUnit(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    placeholder="e.g. arbitrary units"
                  />
                </div>
              </div>

              {/* Series Configuration (Legends & Colors) */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Series / Experimental Treatments ({seriesList.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSeries}
                    className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold hover:bg-blue-100 flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                  >
                    <Plus className="w-3 h-3" /> Add Series
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {seriesList.map((series, sIdx) => (
                    <div
                      key={series.key}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="color"
                          value={series.color || '#2563eb'}
                          onChange={(e) => {
                            const updated = [...seriesList];
                            updated[sIdx].color = e.target.value;
                            setSeriesList(updated);
                          }}
                          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                          title="Pick Series Color"
                        />
                        <input
                          type="text"
                          value={series.name}
                          onChange={(e) => {
                            const updated = [...seriesList];
                            updated[sIdx].name = e.target.value;
                            setSeriesList(updated);
                          }}
                          className="text-xs p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex-1 font-semibold"
                          placeholder="e.g. With inhibitor"
                        />
                      </div>
                      {seriesList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSeries(series.key)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Points Grid */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Data Points / Categories ({dataPoints.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDataPoint}
                    className="text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold hover:bg-slate-200 flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                  >
                    <Plus className="w-3 h-3" /> Add Category Row
                  </button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-200 dark:border-slate-700">
                          {xLabel} {xUnit ? `(${xUnit})` : ''}
                        </th>
                        {seriesList.map((s) => (
                          <th key={s.key} className="p-2 border-r border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: s.color }} />
                              <span>{s.name}</span>
                            </div>
                          </th>
                        ))}
                        <th className="p-2 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dataPoints.map((dp, dpIdx) => (
                        <tr key={dpIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                          <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                            <input
                              type="text"
                              value={dp.x}
                              onChange={(e) => {
                                const updated = [...dataPoints];
                                updated[dpIdx].x = e.target.value;
                                setDataPoints(updated);
                              }}
                              className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-medium"
                            />
                          </td>
                          {seriesList.map((s) => (
                            <td key={s.key} className="p-2 border-r border-slate-100 dark:border-slate-800">
                              <input
                                type="number"
                                step="any"
                                value={dp[s.key] ?? dp.y ?? 0}
                                onChange={(e) => {
                                  const updated = [...dataPoints];
                                  updated[dpIdx][s.key] = parseFloat(e.target.value) || 0;
                                  setDataPoints(updated);
                                }}
                                className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono font-bold"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            {dataPoints.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDataPoint(dpIdx)}
                                className="text-rose-500 hover:text-rose-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Multi-Column Scientific Table Form */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Table Columns & Headers ({tableHeaders.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddTableColumn}
                  className="text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold hover:bg-blue-100 flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                >
                  <Plus className="w-3 h-3" /> Add Column
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                    <tr>
                      {tableHeaders.map((hdr, hIdx) => (
                        <th key={hIdx} className="p-2 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between gap-1.5">
                            <input
                              type="text"
                              value={hdr}
                              onChange={(e) => {
                                const updated = [...tableHeaders];
                                updated[hIdx] = e.target.value;
                                setTableHeaders(updated);
                              }}
                              className="w-full text-xs p-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 font-bold"
                            />
                            {tableHeaders.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTableColumn(hIdx)}
                                className="text-rose-500 hover:text-rose-700 p-0.5"
                                title="Delete column"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="p-2 w-12 text-center">Row Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tableRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-slate-800">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => {
                                const updated = tableRows.map((r) => [...r]);
                                updated[rIdx][cIdx] = e.target.value;
                                setTableRows(updated);
                              }}
                              className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center">
                          {tableRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTableRow(rIdx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAddTableRow}
                  className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold hover:bg-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                >
                  <Plus className="w-3 h-3" /> Add Table Row
                </button>
                <div className="flex-1 max-w-sm ml-4">
                  <input
                    type="text"
                    value={tableCaption}
                    onChange={(e) => setTableCaption(e.target.value)}
                    placeholder="Optional footnote / table caption"
                    className="w-full text-xs p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Section */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Interactive Live Preview (Exact Render for Students)
              </span>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white dark:bg-slate-900">
              <ScienceGraphViewer dataset={previewDataset} tableData={previewTable} isDaylight={true} />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Graph & Table to Question
          </button>
        </div>
      </div>
    </div>
  );
};
