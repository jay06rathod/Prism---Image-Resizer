const PrismButton = ({ children, onClick, disabled, loading }) => {
  return (
    <div className="flex justify-center mt-4">
      
      <div className={`prism-container ${disabled || loading ? "opacity-50" : ""}`}>
        
        <button
          onClick={onClick}
          disabled={disabled || loading}
          className="prism-button"
        >
          {loading ? "Processing..." : children}
        </button>

      </div>

    </div>
  );
};

export default PrismButton;