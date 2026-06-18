import React from 'react';
import { DiaryEntry } from '../types';
import { extractWeight } from '../utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Scale, TrendingUp, Sparkles, TrendingDown, Minus } from 'lucide-react';

interface WeightChartProps {
  entries: DiaryEntry[];
  petName: string;
}

export default function WeightChart({ entries, petName }: WeightChartProps) {
  // Extract and format weight data
  const chartData = entries
    .map((entry) => {
      const weight = extractWeight(entry);
      return {
        id: entry.id,
        dateStr: entry.date, // YYYY-MM-DD
        timeStr: entry.time,
        weight,
        dateTimeValue: new Date(`${entry.date}T${entry.time || '12:00'}`).getTime(),
      };
    })
    .filter((item): item is { id: string; dateStr: string; timeStr: string; weight: number; dateTimeValue: number } => {
      return item.weight !== null && !isNaN(item.weight);
    })
    // Sort chronologically ascending
    .sort((a, b) => a.dateTimeValue - b.dateTimeValue);

  // If there are no data points, or only 1, draw a graceful guide state or a simple single-value card.
  if (chartData.length === 0) {
    return (
      <div className="bg-natural-highlight/30 border border-dashed border-natural-border/50 rounded-3xl p-6 text-center space-y-3">
        <div className="mx-auto w-10 h-10 bg-natural-highlight rounded-full flex items-center justify-center text-natural-secondary">
          <Scale size={20} />
        </div>
        <div>
          <h4 className="text-xs font-serif font-bold text-natural-dark uppercase tracking-wider">
            Monitorowanie wagi pupila
          </h4>
          <p className="text-[11px] text-natural-primary/60 mt-1 max-w-xs mx-auto leading-relaxed">
            Nie zarejestrowano jeszcze danych wagowych dla <strong>{petName}</strong>. Dodaj wpis w kategorii <strong>„Waga / Wymiary”</strong> z podaną wagą (np. <em>14.5 kg</em>), aby aktywować wykres.
          </p>
        </div>
      </div>
    );
  }

  // Format date to short Polish format (e.g., 12 Jun -> 12.06)
  const formatXAxis = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      if (!day || !month) return dateStr;
      return `${day}.${month}`;
    } catch {
      return dateStr;
    }
  };

  // Polish full date formatter for tooltips
  const formatTooltipDate = (dateStr: string) => {
    try {
      const dateObj = new Date(dateStr);
      return dateObj.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const weights = chartData.map((d) => d.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const marginBuffer = Math.max((maxWeight - minWeight) * 0.15, 0.5); // At least 0.5kg padding

  const latestWeight = chartData[chartData.length - 1].weight;
  
  // Calculate weight difference if at least 2 measurements exist
  let weightDiff = 0;
  let hasDiff = false;
  if (chartData.length >= 2) {
    const previousWeight = chartData[chartData.length - 2].weight;
    weightDiff = latestWeight - previousWeight;
    hasDiff = true;
  }

  return (
    <div className="bg-natural-cream rounded-3xl border border-natural-border p-5 shadow-xs space-y-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-natural-highlight rounded-xl text-natural-secondary shadow-xs">
            <Scale size={18} />
          </div>
          <div>
            <h3 className="text-xs font-serif font-bold text-natural-dark uppercase tracking-wider">
              Historia Wagi: {petName}
            </h3>
            <p className="text-[10px] text-natural-primary/60">Automatyczny pomiar z notatek</p>
          </div>
        </div>

        {/* Current Weight Bubble */}
        <div className="text-right">
          <div className="text-sm font-serif font-extrabold text-natural-dark flex items-center gap-1 justify-end">
            <span>{latestWeight.toFixed(1)}</span>
            <span className="text-xs text-natural-secondary font-sans font-normal">kg</span>
          </div>
          
          {hasDiff && (
            <div className="flex items-center gap-0.5 justify-end mt-0.5 text-[10px] font-bold">
              {weightDiff > 0 ? (
                <span className="text-amber-700 flex items-center gap-0.5 bg-amber-50/50 px-1.5 py-0.5 rounded-md border border-amber-250/20">
                  <TrendingUp size={10} /> +{weightDiff.toFixed(2)} kg
                </span>
              ) : weightDiff < 0 ? (
                <span className="text-natural-olive flex items-center gap-0.5 bg-natural-highlight/60 px-1.5 py-0.5 rounded-md border border-natural-border/40">
                  <TrendingDown size={10} /> {weightDiff.toFixed(2)} kg
                </span>
              ) : (
                <span className="text-natural-primary/60 flex items-center gap-0.5 bg-neutral-50 px-1.5 py-0.5 rounded-md border border-neutral-100">
                  <Minus size={10} /> bez zmian
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {chartData.length === 1 ? (
        /* Render fallback state when only 1 measurement is registered */
        <div className="h-28 flex flex-col justify-center items-center bg-natural-highlight/20 border border-natural-border/30 rounded-2xl p-4 text-center">
          <Sparkles size={16} className="text-natural-secondary mb-1 opacity-70" />
          <p className="text-[11px] text-natural-dark font-medium">Pierwszy wpis wagowy zapisany!</p>
          <p className="text-[10px] text-natural-primary/60 mt-0.5">
            Wykres linii trendu aktywuje się po dodaniu co najmniej drugiego pomiaru wagi w kolejnym dniu.
          </p>
        </div>
      ) : (
        /* Recharts Line Chart */
        <div className="h-44 w-full text-xs" style={{ minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7d8461" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#7d8461" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e8e2d9"
              />
              <XAxis
                dataKey="dateStr"
                tickFormatter={formatXAxis}
                stroke="#9a9282"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[
                  Math.max(0, minWeight - marginBuffer),
                  maxWeight + marginBuffer
                ]}
                stroke="#9a9282"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value.toFixed(1)}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-natural-border/70 rounded-2xl p-2.5 shadow-md text-xs space-y-1 z-50">
                        <p className="text-[10px] font-bold text-natural-primary/50">
                          {formatTooltipDate(data.dateStr)} {data.timeStr ? `• ${data.timeStr}` : ''}
                        </p>
                        <p className="font-serif font-extrabold text-natural-dark text-sm">
                          Waga: <span className="text-natural-secondary">{data.weight.toFixed(1)} kg</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#7d8461"
                strokeWidth={2.5}
                dot={{ r: 4, stroke: '#fff', strokeWidth: 1.5, fill: '#7d8461' }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#ae5c3e' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
