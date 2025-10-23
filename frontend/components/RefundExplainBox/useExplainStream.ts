export const useExplainStream = (setText: (txt: string) => void) => {
  const startStream = async (returnId: string, useBackend: boolean = false) => {
    setText("") // Clear previous text
    
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          return_id: returnId, 
          question: "Why is my refund delayed?",
          use_backend: useBackend
        }),
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const reader = res.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }
      
      const decoder = new TextDecoder()
      let buffer = ""
      let accumulatedContent = ""
      let currentStep = ""
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete SSE events
        const lines = buffer.split('\n')
        buffer = lines.pop() || "" // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6) // Remove 'data: ' prefix
            
            try {
              const event = JSON.parse(data)
              
              switch (event.type) {
                case 'step':
                  // Show step with special formatting
                  currentStep = event.content
                  setText(`**${currentStep}**\n\n${accumulatedContent}`)
                  break
                  
                case 'content':
                  // Accumulate content from OpenAI
                  accumulatedContent += event.content
                  setText(`**${currentStep}**\n\n${accumulatedContent}`)
                  break
                  
                case 'error':
                  setText(`**Error:** ${event.content}`)
                  break
                  
                case 'done':
                  // Finalize the response
                  if (currentStep) {
                    setText(`${accumulatedContent}`)
                  } else {
                    setText(accumulatedContent)
                  }
                  return
              }
            } catch (e) {
              // Handle non-JSON data (fallback for old format)
              if (data === '[DONE]') {
                setText(accumulatedContent)
                return
              }
              accumulatedContent += data
              setText(accumulatedContent)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming explanation:", error)
      setText("Error loading explanation. Please try again.")
    }
  }
  
  return { startStream }
}
