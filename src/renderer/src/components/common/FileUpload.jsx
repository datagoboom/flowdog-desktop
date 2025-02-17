import { memo, useCallback, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils';
import Button from './Button';

const FileUpload = memo(({
  value,
  onChange,
  onClear,
  accept,
  maxSize,
  className,
  disabled,
  ...props
}) => {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size if maxSize is provided (in bytes)
    if (maxSize && file.size > maxSize) {
      console.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
      return;
    }

    setFileName(file.name);
    onChange?.(file);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [onChange, maxSize]);

  const handleClear = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onClear?.();
    if (inputRef.current) {
      inputRef.current.value = '';
      setFileName(null);
    }
  }, [onClear]);

  const handleClick = useCallback((e) => {
    if (inputRef.current && !disabled) {
      inputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <div
        onClick={handleClick}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 rounded-md",
          "bg-slate-100 dark:bg-slate-800",
          "border border-slate-200 dark:border-slate-700",
          "cursor-pointer",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled}
        />
        <div className="flex items-center justify-center gap-2 flex-1">
          <Upload className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {fileName || 'Choose File'}
          </span>
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className={cn(
              "p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded",
              "transition-colors duration-200"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value?.size && (
        <div className="text-xs text-slate-500 px-2 text-center">
          Size: {formatFileSize(value.size)}
          {value.type && ` • Type: ${value.type}`}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;