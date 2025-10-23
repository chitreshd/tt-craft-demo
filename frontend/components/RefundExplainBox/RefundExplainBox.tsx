"use client"
import { useState } from "react"
import { Button } from "../ui/Button"
import { useExplainStream } from "./useExplainStream"

export const RefundExplainBox = ({ 
  returnId, 
  useBackend = false 
}: { 
  returnId: string
  useBackend?: boolean 
}) => {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { startStream } = useExplainStream(setText)

  const handleExplain = async () => {
    setIsLoading(true)
    await startStream(returnId, useBackend)
    setIsLoading(false)
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      <Button onClick={handleExplain}>
        {isLoading ? "Loading..." : "Explain"}
      </Button>
      {text && (
        <div className="mt-6 w-full max-w-3xl p-6 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {text.split('\n').map((line, index) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                // Render step headers with special styling
                return (
                  <div key={index} className="mb-2 p-2 bg-blue-100 rounded text-blue-800 font-medium">
                    {line.slice(2, -2)}
                  </div>
                )
              }
              return <div key={index}>{line}</div>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
