import { z } from "zod";

// Validation for the admin service form. Lives here rather than in the route
// file because Next only allows route handlers and its own config to be
// exported from a route module.

/// A slug is how a service is addressed in URLs, so keep it boring.
const slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9-]+$/, "Slug can only use lowercase letters, numbers and dashes.");

const taxon = z
  .string()
  .min(1)
  .max(40)
  .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, dashes or underscores.");

export const ServiceInput = z.object({
  name: z.string().min(1).max(60),
  slug,
  category: taxon,
  platform: taxon,
  region: taxon.nullable().optional(),
  endpoint: taxon.nullable().optional(),
  baseUrl: z.string().url("Base URL must look like http://host:port"),
  usagePath: z.string().startsWith("/").max(120).default("/me/usage"),
  authHeader: z.string().min(1).max(60).default("X-API-Key"),
  kind: z.string().min(1).max(40).default("generic"),
  status: z.enum(["ACTIVE", "DISABLED"]).default("DISABLED"),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  notes: z.string().max(300).nullable().optional(),
  /// Default USD price per 1,000 billable requests; a client can override it.
  /// Null means unpriced, and no cost is shown anywhere.
  pricePer1000: z.number().min(0).max(100000).nullable().optional(),
});
