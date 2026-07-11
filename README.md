# touchpoints

A tiny React component for showing mobile touch points while recording demos.

## Install

```plain
npm install touchpoints
```

## Usage

Render it once near your app root. In Next.js, use a client component.

```tsx
"use client";

import { TouchPoints } from "touchpoints";

export function App() {
  return <TouchPoints />;
}
```

Render it only in development:

```tsx
// Vite
import.meta.env.DEV ? <TouchPoints /> : null;

// Next.js
process.env.NODE_ENV !== "production" ? <TouchPoints /> : null;
```

## Configuration

Customise the indicator with `size`, `color`, and `border`:

```tsx
<TouchPoints size={50} color="hotpink" border="3px solid blue" />
```

## Acknowledgements

Inspired by [visualizeTouches](https://github.com/robb/visualizeTouches) and [TouchInspector](https://github.com/jtrivedi/TouchInspector).
