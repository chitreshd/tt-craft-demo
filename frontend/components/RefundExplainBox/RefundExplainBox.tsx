"use client"
import { useState } from "react"
import { Button } from "../ui/Button"
import { useExplainStream } from "./useExplainStream"

export const RefundExplainBox = ({ returnId }: { returnId: string }) => {
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { startStream } = useExplainStream(setText)

  const handleExplain = async () => {
    setIsLoading(true)
    await startStream(returnId)
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
            {text}
          </div>
        </div>
      )}
    </div>
  )
}
