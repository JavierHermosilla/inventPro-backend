import { z } from 'zod'

const scheduleSchema = z.object({
  cron: z.string().min(1, 'Cron es obligatorio'),
  timezone: z.string().min(1, 'Timezone es obligatorio')
}).optional()

const filtersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  productIds: z.array(z.string().uuid()).optional(),
  userIds: z.array(z.string().uuid()).optional()
}).optional()

export const createReportSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  type: z.string().min(1, 'El tipo es obligatorio'),
  filters: filtersSchema,
  format: z.enum(['pdf', 'xls', 'dashboard']),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  schedule: scheduleSchema,
  deliveryMethod: z.string().optional(),
  sharedWith: z.array(z.string().uuid()).optional()
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
  sharedWith: z.array(z.string().uuid()).optional(),
  lastRunAt: z.date().optional(),
  executionTimeMs: z.number().int().optional()
})
