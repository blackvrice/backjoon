"use client";

import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type { editor, languages, Position } from "monaco-editor";
import { attachJudgeLspToMonaco } from "@/lib/lspMonacoClient";
import { registerJudgeLanguageHints } from "@/lib/monacoHints";

export type JudgeEditorLanguage =
    | "C11"
    | "C++17"
    | "Python 3.12"
    | "Java 17"
    | "Java 21"
    | "Java 26"
    | "JavaScript"
    | "Dart"
    | "C# 12";

type LspAttachLanguage =
    | "C++17"
    | "Python 3.12"
    | "Java 17"
    | "JavaScript"
    | "Dart"
    | "C# 12";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-950 text-sm font-bold text-slate-400">
            Monaco Editor를 불러오는 중입니다...
        </div>
    )
});

type JudgeMonacoEditorProps = {
    value: string;
    onChange: (value: string) => void;
    language: string;
    judgeLanguage?: JudgeEditorLanguage;
    fileName: string;
    height?: string | number;
    theme?: string;
    readOnly?: boolean;
    className?: string;
    options?: editor.IStandaloneEditorConstructionOptions;
    enableLsp?: boolean;

    /**
     * lsp-server/server.ts의 WORKSPACE_ROOT와 맞춰야 합니다.
     *
     * 기본값:
     * C:/web/backjoon/.lsp-workspace
     */
    lspWorkspaceRoot?: string;
};

function getLspAttachLanguage(language?: JudgeEditorLanguage): LspAttachLanguage | null {
    switch (language) {
        case "C11":
        case "C++17":
            return "C++17";

        case "Python 3.12":
            return "Python 3.12";

        case "Java 17":
        case "Java 21":
        case "Java 26":
            return "Java 17";

        case "JavaScript":
            return "JavaScript";

        case "Dart":
            return "Dart";

        case "C# 12":
            return "C# 12";

        default:
            return null;
    }
}

function canUseJudgeLsp(language?: JudgeEditorLanguage) {
    return getLspAttachLanguage(language) !== null;
}


const DEFAULT_LSP_WORKSPACE_ROOT = "C:/web/backjoon/.lsp-workspace";

const LSP_WORKSPACE_FILE: Record<LspAttachLanguage, { folder: string; fileName: string }> = {
    "C++17": {
        folder: "cpp",
        fileName: "Main.cpp"
    },
    "Python 3.12": {
        folder: "python",
        fileName: "Main.py"
    },
    "Java 17": {
        folder: "java",
        fileName: "src/Main.java"
    },
    "JavaScript": {
        folder: "javascript",
        fileName: "Main.js"
    },
    Dart: {
        folder: "dart",
        fileName: "Main.dart"
    },
    "C# 12": {
        folder: "csharp",
        fileName: "Main.cs"
    }
};

function normalizeWorkspaceRoot(workspaceRoot: string) {
    return workspaceRoot.replace(/\\/g, "/").replace(/\/+$/, "");
}

function toFileUri(filePath: string) {
    const normalized = filePath.replace(/\\/g, "/");

    if (normalized.startsWith("file://")) {
        return normalized;
    }

    if (/^[A-Za-z]:\//.test(normalized)) {
        return `file:///${normalized}`;
    }

    return `file://${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}

function getLspModelPath(language: LspAttachLanguage, workspaceRoot = DEFAULT_LSP_WORKSPACE_ROOT) {
    const file = LSP_WORKSPACE_FILE[language];
    const fullPath = `${normalizeWorkspaceRoot(workspaceRoot)}/${file.folder}/${file.fileName}`;

    return toFileUri(fullPath);
}

let pythonFallbackRegistered = false;

function registerPythonFallbackCompletions(monaco: Parameters<OnMount>[1]) {
    if (pythonFallbackRegistered) {
        return;
    }

    pythonFallbackRegistered = true;

    monaco.languages.registerCompletionItemProvider("python", {
        triggerCharacters: [".", "_"],

        provideCompletionItems(
            model: editor.ITextModel,
            position: Position
        ): languages.ProviderResult<languages.CompletionList> {
            const word = model.getWordUntilPosition(position);

            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };

            const kind = monaco.languages.CompletionItemKind;

            const suggestions: languages.CompletionItem[] = [
                {
                    label: "input",
                    kind: kind.Function,
                    insertText: "input()",
                    detail: "Python input",
                    range
                },
                {
                    label: "print",
                    kind: kind.Function,
                    insertText: "print(${1:value})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "Python print",
                    range
                },
                {
                    label: "map",
                    kind: kind.Function,
                    insertText: "map(${1:int}, ${2:input().split()})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "Python map",
                    range
                },
                {
                    label: "list",
                    kind: kind.Function,
                    insertText: "list(${1:iterable})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "Python list",
                    range
                },
                {
                    label: "range",
                    kind: kind.Function,
                    insertText: "range(${1:n})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "Python range",
                    range
                },
                {
                    label: "enumerate",
                    kind: kind.Function,
                    insertText: "enumerate(${1:items})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "Python enumerate",
                    range
                },
                {
                    label: "split",
                    kind: kind.Method,
                    insertText: "split()",
                    detail: "str.split",
                    range
                },
                {
                    label: "strip",
                    kind: kind.Method,
                    insertText: "strip()",
                    detail: "str.strip",
                    range
                },
                {
                    label: "append",
                    kind: kind.Method,
                    insertText: "append(${1:value})",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "list.append",
                    range
                },
                {
                    label: "sys.stdin.readline",
                    kind: kind.Snippet,
                    insertText: "sys.stdin.readline().rstrip()",
                    detail: "빠른 입력",
                    range
                },
                {
                    label: "import sys",
                    kind: kind.Snippet,
                    insertText: "import sys",
                    detail: "sys import",
                    range
                },
                {
                    label: "read all input",
                    kind: kind.Snippet,
                    insertText:
                        "import sys\ninput = sys.stdin.readline\n\n${1:n} = int(input())",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "백준 빠른 입력 템플릿",
                    range
                },
                {
                    label: "two integers",
                    kind: kind.Snippet,
                    insertText: "a, b = map(int, input().split())",
                    detail: "두 정수 입력",
                    range
                },
                {
                    label: "integer list",
                    kind: kind.Snippet,
                    insertText: "arr = list(map(int, input().split()))",
                    detail: "정수 배열 입력",
                    range
                },
                {
                    label: "for loop",
                    kind: kind.Snippet,
                    insertText: "for ${1:i} in range(${2:n}):\n    ${3:pass}",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "for loop",
                    range
                },
                {
                    label: "main",
                    kind: kind.Snippet,
                    insertText:
                        "import sys\ninput = sys.stdin.readline\n\n\ndef main():\n    ${1:pass}\n\n\nif __name__ == \"__main__\":\n    main()",
                    insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    detail: "main template",
                    range
                }
            ];

            return {
                suggestions
            };
        }
    });
}

export default function JudgeMonacoEditor({
                                              value,
                                              onChange,
                                              language,
                                              judgeLanguage,
                                              fileName,
                                              height = "100%",
                                              theme = "vs-dark",
                                              readOnly = false,
                                              className = "",
                                              options,
                                              enableLsp,
                                              lspWorkspaceRoot = DEFAULT_LSP_WORKSPACE_ROOT
                                          }: JudgeMonacoEditorProps) {
    const lspAttachLanguage = getLspAttachLanguage(judgeLanguage);

    const shouldAttachLsp =
        !readOnly &&
        Boolean(lspAttachLanguage) &&
        (enableLsp ?? canUseJudgeLsp(judgeLanguage));

    /**
     * 중요:
     * jdtls(Java LSP)는 inmemory://model/1 같은 Monaco 임시 URI에서는
     * 문맥 기반 멤버 자동완성이 약하게 동작할 수 있습니다.
     *
     * LSP를 붙일 때는 Monaco 모델 path와 LSP에 넘기는 fileName을
     * 실제 workspace 파일 URI로 통일합니다.
     *
     * Java 예:
     * file:///C:/web/backjoon/.lsp-workspace/java/src/Main.java
     */
    const editorPath =
        shouldAttachLsp && lspAttachLanguage
            ? getLspModelPath(lspAttachLanguage, lspWorkspaceRoot)
            : fileName;

    const mergedOptions: editor.IStandaloneEditorConstructionOptions = {
        fontSize: 14,
        fontFamily: "JetBrains Mono, Consolas, 'Courier New', monospace",
        fontLigatures: true,

        minimap: {
            enabled: true,
            ...(options?.minimap ?? {})
        },

        scrollBeyondLastLine: false,
        automaticLayout: true,

        tabSize: 4,
        insertSpaces: true,
        wordWrap: "off",

        lineNumbers: "on",
        glyphMargin: false,
        folding: true,

        renderLineHighlight: "all",
        roundedSelection: true,

        bracketPairColorization: {
            enabled: true,
            ...(options?.bracketPairColorization ?? {})
        },

        guides: {
            bracketPairs: true,
            indentation: true,
            ...(options?.guides ?? {})
        },

        padding: {
            top: 16,
            bottom: 16,
            ...(options?.padding ?? {})
        },

        smoothScrolling: true,
        cursorBlinking: "smooth",
        cursorSmoothCaretAnimation: "on",
        overviewRulerBorder: false,

        quickSuggestions: {
            other: true,
            comments: false,
            strings: true,
            ...(typeof options?.quickSuggestions === "object"
                ? options.quickSuggestions
                : {})
        },

        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",

        parameterHints: {
            enabled: true,
            ...(options?.parameterHints ?? {})
        },

        suggest: {
            showMethods: true,
            showFunctions: true,
            showConstructors: true,
            showFields: true,
            showVariables: true,
            showClasses: true,
            showStructs: true,
            showInterfaces: true,
            showModules: true,
            showProperties: true,
            showEvents: true,
            showOperators: true,
            showUnits: true,
            showValues: true,
            showConstants: true,
            showEnums: true,
            showEnumMembers: true,
            showKeywords: true,
            showWords: true,
            showColors: true,
            showFiles: true,
            showReferences: true,
            showFolders: true,
            showTypeParameters: true,
            showSnippets: true,
            ...(options?.suggest ?? {})
        },

        autoClosingBrackets: "always",
        autoClosingQuotes: "always",
        autoIndent: "full",
        formatOnPaste: false,
        formatOnType: false,

        fixedOverflowWidgets: true,

        readOnly,

        ...options
    };

    const handleMount: OnMount = (editorInstance, monaco) => {
        registerJudgeLanguageHints(monaco);
        registerPythonFallbackCompletions(monaco);

        const model = editorInstance.getModel();

        if (model) {
            monaco.editor.setModelLanguage(model, language);

            console.log("[JudgeMonacoEditor mounted]", {
                language,
                judgeLanguage,
                fileName,
                editorPath,
                modelUri: model.uri.toString(),
                modelLanguage: model.getLanguageId(),
                shouldAttachLsp,
                lspAttachLanguage
            });
        }

        let lspDisposable: { dispose: () => void } | null = null;

        if (shouldAttachLsp && lspAttachLanguage) {
            lspDisposable = attachJudgeLspToMonaco({
                monaco,
                editor: editorInstance,
                language: lspAttachLanguage,
                fileName: editorPath,
                initialCode: value
            });
        }

        editorInstance.onDidDispose(() => {
            lspDisposable?.dispose();
            lspDisposable = null;
        });
    };

    return (
        <div className={`relative h-full w-full overflow-visible ${className}`}>
            <MonacoEditor
                key={editorPath}
                height={height}
                theme={theme}
                language={language}
                value={value}
                path={editorPath}
                onMount={handleMount}
                onChange={(nextValue) => onChange(nextValue ?? "")}
                options={mergedOptions}
            />
        </div>
    );
}