import { useRef, useEffect, useState } from 'react';
import hljs from 'highlight.js';
import { useFlow } from '../../contexts/FlowContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function CodeEditor({ value = '', node, language, updateField }) {
  const overlayRef = useRef(null);
  const editorRef = useRef(null);
  const { isDark } = useTheme();
  const { updateNodeData } = useFlow();
  const [rows, setRows] = useState(1);
  const [localValue, setLocalValue] = useState(value);
  const [highlightedCode, setHighlightedCode] = useState('');

  useEffect(() => {
    // Dynamic import of the CSS based on theme
    if (isDark) {
      import('../../../../../node_modules/highlight.js/styles/github.css');
    } else {
      import('../../../../../node_modules/highlight.js/styles/stackoverflow-dark.css');
    }
  }, [isDark]);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Update highlighted code when value changes
  useEffect(() => {
    if (language && localValue) {
      const highlighted = hljs.highlight(localValue, { language }).value;
      setHighlightedCode(highlighted);
    }
  }, [localValue, language]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    
    if (node && updateField) {
      // Update just the specific field instead of the entire data object
      updateNodeData(node.id, updateField, newValue);

      console.log('Updated node field:', {
        field: updateField,
        value: newValue
      });
      
      const lines = newValue.split('\n').length;
      setRows(Math.max(lines, 1));
    }
  };

  const formatJSON = (value) => {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch (e) {
      return value;
    }
  };

  // Sync scroll between editor and highlight overlay
  useEffect(() => {
    const syncScroll = (e) => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = e.target.scrollTop;
      }
    };

    const editor = editorRef.current;
    editor?.addEventListener('scroll', syncScroll);
    return () => editor?.removeEventListener('scroll', syncScroll);
  }, []);

  return (
    <div className={`relative rounded border ${isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-slate-50'}`}>
      {language && (
        <div 
          ref={overlayRef}
          className="absolute inset-0 overflow-auto pointer-events-none h-full"
          style={{ 
            padding: '0.75rem'
          }}
        >
          <pre>
            <code 
              dangerouslySetInnerHTML={{ __html: highlightedCode || ' ' }}
              style={{ 
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.5
              }}
            />
          </pre>
        </div>
      )}
      <textarea
        ref={editorRef}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck="false"
        className={`
          relative block w-full h-full resize-none 
          bg-transparent p-3 font-mono text-transparent 
          outline-none border-none
          ${isDark ? 'caret-slate-300' : 'caret-slate-700'}
        `}
        style={{ 
          minHeight: `${rows * 1.5}rem`,
          lineHeight: 1.5,
          fontSize: '14px'
        }}
        rows={rows}
        onBlur={language === 'json' ? () => handleChange(formatJSON(localValue)) : null}
      />
    </div>
  );
}