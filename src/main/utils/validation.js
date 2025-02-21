import { z } from 'zod';

// Panel configuration schemas based on type
const textPanelConfig = z.object({
  format: z.string().optional(),
  template: z.string().optional()
});

const seriesChartConfig = z.object({
  chartType: z.enum(['line', 'bar', 'area']),
  xAxis: z.string(),
  yAxis: z.array(z.string()),
  aggregation: z.enum(['sum', 'avg', 'min', 'max']).optional()
});

const pieChartConfig = z.object({
  valueField: z.string(),
  labelField: z.string(),
  colors: z.array(z.string()).optional()
});

// Panel schema
const panelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  size: z.tuple([
    z.number().int().positive().max(4), // x units
    z.number().int().positive().max(4)  // y units
  ]),
  flow_id: z.string().uuid(),
  type: z.enum(['text', 'series_chart', 'pie_chart']),
  config: z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), ...textPanelConfig.shape }),
    z.object({ type: z.literal('series_chart'), ...seriesChartConfig.shape }),
    z.object({ type: z.literal('pie_chart'), ...pieChartConfig.shape })
  ]),
  last_data: z.object({
    timestamp: z.number(),
    data: z.record(z.unknown())
  }).optional(),
  schedule: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])) (\*|([0-6]))$/)
});

// Dashboard schema validation
const dashboardSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  panels: z.array(panelSchema).default([]),
  created_at: z.number(),
  updated_at: z.number()
});

export const validateDashboard = (data) => {
  return dashboardSchema.parse(data);
};

export const validatePanel = (data) => {
  return panelSchema.parse(data);
};

export const sanitizePath = (str) => {
  return str.replace(/[^a-zA-Z0-9-_]/g, '');
}; 