// src/schemas/reports.schema.js
import { z } from 'zod'

const baseScheduleSchema = z.object({
  cron: z.string().min(1, 'Cron es obligatorio'),
  timezone: z.string().min(1, 'Timezone es obligatorio').optional()
})

const scheduleSchema = z.preprocess((value) => {
  if (value == null || typeof value !== 'object') return value
  const typed = value
  return {
    cron: typed.cron,
    timezone: typed.timezone ?? 'UTC'
  }
}, baseScheduleSchema).optional()

const filtersSchema = z.record(z.string(), z.any()).optional()

export const createReportSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  type: z.string().min(1, 'El tipo es obligatorio'),
  filters: filtersSchema,
  format: z.enum(['pdf', 'xls', 'dashboard']),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  schedule: scheduleSchema,
  deliveryMethod: z.string().optional(),
  sharedWith: z.array(z.string().min(1)).optional()
})

export const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  filters: filtersSchema,
  format: z.enum(['pdf', 'xls', 'dashboard']).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  schedule: scheduleSchema,
  deliveryMethod: z.string().optional(),
  sharedWith: z.array(z.string().min(1)).optional(),
  lastRunAt: z.date().optional(),
  executionTimeMs: z.number().int().optional()
})
