export const Button = ({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className="px-6 py-3 bg-white text-teal-600 border-2 border-teal-600 rounded-full hover:bg-teal-50 transition-colors font-medium text-lg"
  >
    {children}
  </button>
)
