import { EventEmitter } from "node:events";

// One process-wide event bus: the IDLE worker emits "change" the moment it
// ingests a new code, and every open SSE stream is subscribed so it can push
// instantly. Stored on globalThis so Next's separate route bundles (and dev HMR
// re-evaluation) all share the same emitter instead of each making its own.
const g = globalThis as unknown as { __codesBus?: EventEmitter };
export const codesBus: EventEmitter = (g.__codesBus ??= new EventEmitter());
// Many concurrent SSE viewers each add a listener — lift the default-10 cap so
// Node doesn't warn about a "leak".
codesBus.setMaxListeners(0);
