import {createCandidates} from './generator.js';
// Replace this provider with a same-origin server API client in the future.
// Keep credentials on the server; validate outputs and enforce non-adult images.
// Raster image responses will require a separate preview/export adapter.
export const partsProvider={async generate(input){return createCandidates(input);}};
