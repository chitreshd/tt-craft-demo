Perfect — you’re absolutely right. The frontend spec so far only *uses* those components, but it doesn’t **document or enforce their reusability** or define a **showcase page** that demonstrates both components clearly and modularly.

Below is an updated section you can append to `demo.md` to make the frontend portion **explicitly reusable and component-driven** — ready for Cursor or Next.js to scaffold.

---

## 🎨 **Frontend Architecture — Reusable Components + Showcase**

We’ll structure the frontend so both major UI elements are reusable across pages and can be imported independently in any view or dashboard.

### 🧩 **Component Hierarchy**

```
frontend/
├── app/
│   ├── demo/
│   │   ├── page.tsx               # Showcase page combining both components
│   └── layout.tsx
├── components/
│   ├── RefundStatusCard/
│   │   ├── index.tsx              # Exports component
│   │   ├── RefundStatusCard.tsx   # Core timeline visualization
│   │   ├── types.ts               # Shared TS interfaces
│   ├── RefundExplainBox/
│   │   ├── index.tsx
│   │   ├── RefundExplainBox.tsx   # SSE streaming explanation
│   │   ├── useExplainStream.ts    # Hook for SSE logic
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ProgressBar.tsx
│       └── Typography.tsx
└── pages/api/
    ├── status.ts                  # Proxy to Go /v1/status/:id
    └── explain.ts                 # Proxy to Go /v1/status/explain
```

---

### 🧠 **Type Definitions (`components/RefundStatusCard/types.ts`)**

```ts
export type RefundHistory = {
  stage: string
  timestamp: string
}

export type RefundStatus = {
  return_id: string
  status: string
  eta_date: string
  confidence: number
  history: RefundHistory[]
}
```

---

### 📦 **Reusable Component 1: RefundStatusCard**

`/components/RefundStatusCard/RefundStatusCard.tsx`

```tsx
import { RefundStatus } from "./types"
import { Card } from "../ui/Card"
import { ProgressBar } from "../ui/ProgressBar"

export const RefundStatusCard = ({ data }: { data: RefundStatus }) => {
  const stages = ["FILED", "ACCEPTED", "APPROVED", "SENT", "DEPOSITED"]
  const currentIdx = stages.indexOf(data.status)
  const progress = ((currentIdx + 1) / stages.length) * 100

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-2">Refund Status: {data.status}</h3>
      <ProgressBar value={progress} />
      <ul className="mt-2 text-sm text-gray-600">
        {data.history.map(h => (
          <li key={h.stage}>
            {h.stage} – {new Date(h.timestamp).toLocaleDateString()}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm">ETA: {data.eta_date}</p>
      <p className="text-xs text-gray-500">
        Confidence: {(data.confidence * 100).toFixed(1)}%
      </p>
    </Card>
  )
}
```

---

### 📦 **Reusable Component 2: RefundExplainBox**

`/components/RefundExplainBox/RefundExplainBox.tsx`

```tsx
"use client"
import { useState } from "react"
import { Button } from "../ui/Button"
import { useExplainStream } from "./useExplainStream"

export const RefundExplainBox = ({ returnId }: { returnId: string }) => {
  const [text, setText] = useState("")
  const { startStream } = useExplainStream(setText)

  return (
    <div className="mt-4">
      <Button onClick={() => startStream(returnId)}>Explain Delay</Button>
      <div className="mt-3 text-sm text-gray-800 whitespace-pre-wrap">{text}</div>
    </div>
  )
}
```

---

### ⚙️ **Custom Hook for SSE**

`/components/RefundExplainBox/useExplainStream.ts`

```ts
export const useExplainStream = (setText: (txt: string) => void) => {
  const startStream = async (returnId: string) => {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ return_id: returnId, question: "Why is my refund delayed?" }),
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader!.read()
      if (done) break
      setText(prev => prev + decoder.decode(value))
    }
  }
  return { startStream }
}
```

---

### 🧩 **UI Primitives (for reusability)**

#### `/components/ui/Card.tsx`

```tsx
export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="border rounded-xl shadow p-4 bg-white">{children}</div>
)
```

#### `/components/ui/Button.tsx`

```tsx
export const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
  >
    {children}
  </button>
)
```

#### `/components/ui/ProgressBar.tsx`

```tsx
export const ProgressBar = ({ value }: { value: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
    <div
      className="bg-green-500 h-2 rounded-full transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
)
```

---

### 🌐 **Showcase Page**

`/app/demo/page.tsx`

```tsx
"use client"
import { useState, useEffect } from "react"
import { RefundStatusCard } from "@/components/RefundStatusCard"
import { RefundExplainBox } from "@/components/RefundExplainBox"

export default function DemoPage() {
  const [status, setStatus] = useState<any>(null)
  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(setStatus)
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">Refund Status Demo</h1>
      {status && (
        <>
          <RefundStatusCard data={status} />
          <RefundExplainBox returnId={status.return_id} />
        </>
      )}
    </div>
  )
}
```

---

### ✅ **Why This Frontend Design Is Strong**

| Aspect              | Design Decision                                                  | Benefit                                 |
| ------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| **Reusability**     | Components split by feature (RefundStatusCard, RefundExplainBox) | Drop-in widgets for any dashboard       |
| **Extensibility**   | UI primitives in `/components/ui`                                | Shared styling + consistent look        |
| **SSE abstraction** | Custom hook `useExplainStream`                                   | Makes ExplainBox declarative + testable |
| **Showcase page**   | `/demo` combines both components                                 | Visually demonstrates the full workflow |
| **Type safety**     | Centralized TS types                                             | Safe refactoring + autocompletion       |

---

Would you like me to include **Storybook setup** (so you can preview each component independently in isolation with mock data)?
That would make showcasing and testing them even cleaner.

