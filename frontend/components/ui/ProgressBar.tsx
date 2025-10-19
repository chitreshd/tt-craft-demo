export const ProgressBar = ({ value }: { value: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
    <div
      className="bg-teal-500 h-2 rounded-full transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
)
