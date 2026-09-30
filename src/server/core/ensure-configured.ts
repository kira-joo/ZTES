import "reflect-metadata";
import { configureToolkit } from "./toolkit.config";

// Imported by route-factories, so a route is never evaluated against an
// unconfigured toolkit — including in tests and scripts that skip instrumentation.
configureToolkit();

export {};
