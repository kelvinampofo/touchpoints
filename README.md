# touchpoints

Tiny React component for showing mobile touch points while recording demos from a device or a Simulator.

## Demo

<video src="./.github/demo.mp4" controls muted playsinline></video>

## Install

```txt
npm install touchpoints
```

## Usage

Render the component once near the app root, wherever that fits your setup. In Next.js, render it from a client component.

```tsx
"use client";

import { TouchPoints } from "touchpoints";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <TouchPoints />
    </div>
  );
}
```

The built-in pill toggles touchpoints on and off and remembers the last choice in local storage.

You can also control the component yourself:

```tsx
<TouchPoints enabled={isEnabled} onEnabledChange={setIsEnabled} hideToggle />
```

You will usually only want this in development, so render it conditionally in your app.

Vite:

```tsx
{
  import.meta.env.DEV ? <TouchPoints /> : null;
}
```

Next.js:

```tsx
"use client";

{
  process.env.NODE_ENV !== "production" ? <TouchPoints /> : null;
}
```

## Props

```ts
interface TouchPointsProps {
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  hideToggle?: boolean;
  size?: number;
  accentColor?: string;
  position?: "top-left" | "top-right" | "bottom-right" | "bottom-left";
}
```

## Acknowledgements

Heavy inspiration comes from [visualizeTouches](https://github.com/robb/visualizeTouches) by [@robb](https://github.com/robb) and [TouchInspector](https://github.com/jtrivedi/TouchInspector) by [@jtrivedi](https://github.com/jtrivedi)
