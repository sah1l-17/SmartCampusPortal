const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    medium: "h-10 w-10",
    large: "h-16 w-16",
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 animate-fade-in">
      <div className={`loading-spinner ${sizeClasses[size]} mb-4`}></div>
      {text && <p className="text-sm text-gray-600 font-medium animate-pulse">{text}</p>}
    </div>
  )
}

export default LoadingSpinner
