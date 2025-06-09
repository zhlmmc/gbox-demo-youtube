import { AndroidBoxOperator } from 'gbox-sdk/wrapper/box/android.mjs';

// Store active gbox instances - shared between tools
export const activeInstances = new Map<string, AndroidBoxOperator>(); 