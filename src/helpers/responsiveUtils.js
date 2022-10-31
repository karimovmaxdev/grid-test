// @flow

import {cloneLayout, compact, correctBounds} from './utils';


/**
 * Given a width, find the highest breakpoint that matches is valid for it (width > breakpoint).
 *
 */
export function getBreakpointFromWidth(breakpoints, width) {
  const sorted = sortBreakpoints(breakpoints)
  let matching = sorted[0];
  for (let i = 1, len = sorted.length; i < len; i++) {
    const breakpointName = sorted[i];
    if (width > breakpoints[breakpointName]) matching = breakpointName;
  }
  return matching;
}


/**

 */
export function getColsFromBreakpoint(breakpoint, cols) {
  if (!cols[breakpoint]) {
    throw new Error("ResponsiveGridLayout: `cols` entry for breakpoint " + breakpoint + " is missing!");
  }
  return cols[breakpoint];
}

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *

 */
export function findOrGenerateResponsiveLayout(orgLayout, layouts, breakpoints,
                                               breakpoint, lastBreakpoint,
                                               cols, verticalCompact) {
  // If it already exists, just return it.
  if (layouts[breakpoint]) return cloneLayout(layouts[breakpoint]);
  // Find or generate the next layout
  let layout = orgLayout;

  const breakpointsSorted = sortBreakpoints(breakpoints);
  const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
  for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
    const b = breakpointsAbove[i];
    if (layouts[b]) {
      layout = layouts[b];
      break;
    }
  }
  layout = cloneLayout(layout || []); // clone layout so we don't modify existing items
  return compact(correctBounds(layout, {cols: cols}), verticalCompact);
}

export function generateResponsiveLayout(layout, breakpoints,
                                               breakpoint, lastBreakpoint,
                                               cols, verticalCompact) {
  // If it already exists, just return it.
  /*if (layouts[breakpoint]) return cloneLayout(layouts[breakpoint]);
  // Find or generate the next layout
  let layout = layouts[lastBreakpoint];*/
    /*const breakpointsSorted = sortBreakpoints(breakpoints);
  const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
  for (let i = 0, len = breakpointsAbove.length; i < len; i++) {
    const b = breakpointsAbove[i];
    if (layouts[b]) {
      layout = layouts[b];
      break;
    }
  }*/
  layout = cloneLayout(layout || []); // clone layout so we don't modify existing items
  return compact(correctBounds(layout, {cols: cols}), verticalCompact);
}

/**
 * Given breakpoints, return an array of breakpoints sorted by width. This is usually
 * e.g. ['xxs', 'xs', 'sm', ...]
 *
 */
export function sortBreakpoints(breakpoints) {
  const keys = Object.keys(breakpoints);
  return keys.sort(function(a, b) {
    return breakpoints[a] - breakpoints[b];
  });
}
