const PrismButton = ({ children, onClick, disabled, loading }) => {
  return (
    <div className="flex justify-center mt-4">
      <div className={`prism-container transition-all duration-300 ${disabled || loading ? "opacity-50" : ""}`}>
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className={`prism-button relative overflow-hidden transition-all duration-200
            ${!disabled && !loading ? "hover:scale-[1.03] active:scale-[0.97]" : ""}
          `}
        >
          {/* Shimmer sweep */}
          {!disabled && !loading && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          )}

          {/* Loading spinner */}
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Processing...
            </span>
          ) : children}
        </button>
      </div>
      </div>
  );
};

export default PrismButton;