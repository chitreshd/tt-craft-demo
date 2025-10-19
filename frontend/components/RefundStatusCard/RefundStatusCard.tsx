import { RefundStatus } from "./types"
import { Card } from "../ui/Card"

export const RefundStatusCard = ({ data }: { data: RefundStatus }) => {
  const stages = [
    { key: "FILED", label: "E-filed" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "RETURN_RECEIVED", label: "Return Received" },
    { key: "APPROVED", label: "Refund Approved" },
    { key: "SENT", label: "Refund Sent" }
  ]
  
  const currentIdx = stages.findIndex(s => s.key === data.status)
  const progress = currentIdx >= 0 ? ((currentIdx + 1) / stages.length) * 100 : 0

  // Find dates for each stage from history
  const getDateForStage = (stageKey: string) => {
    const historyItem = data.history.find(h => h.stage === stageKey)
    if (historyItem) {
      const date = new Date(historyItem.timestamp)
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
    }
    return null
  }

  return (
    <Card>
      <div className="py-8">
        {/* Timeline visualization */}
        <div className="relative mb-12">
          {/* Progress line */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200" style={{ zIndex: 0 }}>
            <div 
              className="h-full bg-teal-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Stage markers and labels */}
          <div className="relative flex justify-between" style={{ zIndex: 1 }}>
            {stages.map((stage, idx) => {
              const isCompleted = idx <= currentIdx
              const date = getDateForStage(stage.key)
              
              return (
                <div key={stage.key} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Circle marker */}
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-teal-600 border-4 border-teal-600' 
                        : 'bg-gray-200 border-4 border-gray-200'
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Stage label */}
                  <div className="mt-4 text-center">
                    <div className="font-semibold text-gray-900 text-sm mb-1 whitespace-nowrap">
                      {stage.label}
                    </div>
                    {date && (
                      <div className="text-gray-600 text-sm">
                        {date}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Expected refund date */}
        <div className="text-center mt-8 mb-6">
          <p className="text-2xl font-bold text-gray-900">
            Expected Refund Date: {new Date(data.eta_date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Confidence: {(data.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>
    </Card>
  )
}
