export const useExplainStream = (setText: (txt: string) => void) => {
  const startStream = async (returnId: string) => {
    setText("") // Clear previous text
    
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          return_id: returnId, 
          question: "Why is my refund delayed?" 
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
      let accumulatedText = ""
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        accumulatedText += chunk
        setText(accumulatedText)
      }
    } catch (error) {
      console.error("Error streaming explanation:", error)
      setText("Error loading explanation. Please try again.")
    }
  }
  
  return { startStream }
}
