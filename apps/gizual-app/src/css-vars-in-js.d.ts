import "react";

/**
 * Extend the CSSProperties interface to include custom properties.
 * This allows for easy css variable assignment in JS contexts.
 */
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
