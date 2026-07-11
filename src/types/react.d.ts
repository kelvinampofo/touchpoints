import "react";

declare module "react" {
  interface CSSProperties {
    [property: `--touchpoints-${string}`]: string | undefined;
  }
}
