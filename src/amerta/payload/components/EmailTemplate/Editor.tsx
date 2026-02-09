import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Editor from "@monaco-editor/react";
// ✅ Import the CSS Module
import styles from "./editor.module.scss";
import { useDebounce } from "@/amerta/utilities/useDebounce";

interface EditorComponentProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder: string;
  theme: string;
  onToggleUpload: () => void;
  onFormatDocument?: () => void;
}

export interface EditorRef {
  getEditor: () => any;
  revealLineInCenter: (lineNumber: number) => void;
  setPosition: (position: { lineNumber: number; column: number }) => void;
  createDecorationsCollection: (decorations: any[]) => any;
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

const EditorComponent = forwardRef<EditorRef, EditorComponentProps>(
  ({ value, onChange, language, placeholder, theme, onToggleUpload, onFormatDocument }, ref) => {
    const [editorValue, setEditorValue] = useState(value);
    const editorValueDebounced = useDebounce(editorValue, 1000);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    const [wrapText, setWrapText] = useState(false);
    const [minimap, setMinimap] = useState(true);

    useImperativeHandle(
      ref,
      () => ({
        getEditor: () => editorRef.current,
        revealLineInCenter: (lineNumber: number) => {
          if (editorRef.current) editorRef.current.revealLineInCenter(lineNumber);
        },
        setPosition: (position: { lineNumber: number; column: number }) => {
          if (editorRef.current) editorRef.current.setPosition(position);
        },
        createDecorationsCollection: (decorations: any[]) => {
          if (editorRef.current) return editorRef.current.createDecorationsCollection(decorations);
          return null;
        },
        focus: () => {
          if (editorRef.current) editorRef.current.focus();
        },
        getValue: () => (editorRef.current ? editorRef.current.getValue() : ""),
        setValue: (val: string) => {
          if (editorRef.current) editorRef.current.setValue(val);
        },
      }),
      []
    );

    useEffect(() => {
      onChange(editorValueDebounced);
    }, [editorValueDebounced]);

    useEffect(() => {
      setEditorValue(value);
    }, [value]);

    const handleEditorDidMount = (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
        onChange(editor.getValue());
      });
      editor.focus();
    };

    const handleSearch = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.getAction("actions.find").run();
      }
    };

    const handleAddImage = () => {
      if (editorRef.current) onToggleUpload();
    };

    const handleMoreCommands = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.trigger("", "editor.action.quickCommand", null);
      }
    };

    const handleFormatDocument = () => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.getAction("editor.action.formatDocument").run();
        if (onFormatDocument) {
          setTimeout(() => onFormatDocument(), 100);
        }
      }
    };

    const handleWrapText = () => {
      if (editorRef.current && monacoRef.current) {
        const currentValue = editorRef.current.getOption(monacoRef.current.editor.EditorOption.wordWrap);
        editorRef.current.updateOptions({ wordWrap: currentValue === "on" ? "off" : "on" });
        setWrapText(currentValue === "on" ? false : true);
      }
    };

    const handleToggleMinimap = () => {
      if (editorRef.current && monacoRef.current) {
        const currentValue = editorRef.current.getOption(monacoRef.current.editor.EditorOption.minimap).enabled;
        editorRef.current.updateOptions({ minimap: { enabled: !currentValue } });
        setMinimap(!minimap);
      }
    };

    return (
      <div className={styles.editorWrapper}>
        <div className={styles.toolbar}>
          <button title="Search" onClick={handleSearch} className={styles.toolbarButton}>
            <svg className={styles.icon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M29,27.5859l-7.5521-7.5521a11.0177,11.0177,0,1,0-1.4141,1.4141L27.5859,29ZM4,13a9,9,0,1,1,9,9A9.01,9.01,0,0,1,4,13Z" />
            </svg>
          </button>
          
          <button title="Open Media" onClick={handleAddImage} className={styles.toolbarButton}>
            <svg className={styles.icon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M19,14a3,3,0,1,0-3-3A3,3,0,0,0,19,14Zm0-4a1,1,0,1,1-1,1A1,1,0,0,1,19,10Z" />
              <path d="M26,4H6A2,2,0,0,0,4,6V26a2,2,0,0,0,2,2H26a2,2,0,0,0,2-2V6A2,2,0,0,0,26,4Zm0,22H6V20l5-5,5.59,5.59a2,2,0,0,0,2.82,0L21,19l5,5Zm0-4.83-3.59-3.59a2,2,0,0,0-2.82,0L18,19.17l-5.59-5.59a2,2,0,0,0-2.82,0L6,17.17V6H26Z" />
            </svg>
          </button>
          
          <button title="Format Document" onClick={handleFormatDocument} className={styles.toolbarButton}>
            <svg className={styles.icon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect x={14} y={6} width={14} height={2} />
              <rect x={14} y={12} width={14} height={2} />
              <rect x={7} y={18} width={21} height={2} />
              <rect x={7} y={24} width={21} height={2} />
              <polygon points="4 13.59 7.29 10 4 6.41 5.42 5 10.04 10 5.42 15 4 13.59" />
            </svg>
          </button>
          
          <button 
            title="Toggle Wrap" 
            onClick={handleWrapText} 
            className={`${styles.toolbarButton} ${wrapText ? styles.active : ""}`}
          >
            <svg className={styles.icon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <rect x={4} y={23} width={8} height={2} />
              <path d="M24.5232,14H4v2H24.5a3.5,3.5,0,0,1,0,7H18.8281l2.586-2.5859L20,19l-5,5,5,5,1.4141-1.4141L18.8281,25H24.533a5.5,5.5,0,0,0-.01-11Z" />
              <rect x={4} y={5} width={24} height={2} />
            </svg>
          </button>
          
          <button 
            title="Toggle Minimap" 
            onClick={handleToggleMinimap} 
            className={`${styles.toolbarButton} ${minimap ? styles.active : ""}`}
          >
            <svg className={styles.icon} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M26,10V22a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2V10A2,2,0,0,1,8,8H24A2,2,0,0,1,26,10ZM8,22H24V10H8Z" />
              <path d="M24,28v4H22V28H10v4H8V28a2,2,0,0,1,2-2H22A2,2,0,0,1,24,28Z" />
              <path d="M24,0V4a2,2,0,0,1-2,2H10A2,2,0,0,1,8,4V0h2V4H22V0Z" />
            </svg>
          </button>
          
          <button title="More Commands" onClick={handleMoreCommands} className={styles.toolbarButton}>
            <svg className={styles.icon} style={{ height: '1rem', width: '1rem' }} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M16,4c6.6,0,12,5.4,12,12s-5.4,12-12,12S4,22.6,4,16S9.4,4,16,4 M16,2C8.3,2,2,8.3,2,16s6.3,14,14,14s14-6.3,14-14 S23.7,2,16,2z" />
              <polygon points="24,15 17,15 17,8 15,8 15,15 8,15 8,17 15,17 15,24 17,24 17,17 24,17 " />
            </svg>
          </button>
        </div>
        
        <Editor
          height="100%"
          defaultLanguage={language}
          defaultValue={placeholder}
          onChange={(value) => setEditorValue(value || "")}
          options={{ padding: { top: 0 }, autoIndent: "full" }}
          onMount={handleEditorDidMount}
          value={editorValue}
          theme={theme}
        />
      </div>
    );
  }
);

EditorComponent.displayName = "EditorComponent";

export default EditorComponent;