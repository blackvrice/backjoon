// lib/lspMonacoClient.ts

import type * as Monaco from "monaco-editor";

type JudgeLanguage =
    | "C11"
    | "C++17"
    | "Python 3.12"
    | "Java 17"
    | "JavaScript"
    | "Dart"
    | "C# 12";

type LspLanguage =
    | "cpp"
    | "python"
    | "java"
    | "javascript"
    | "dart"
    | "csharp"
    | null;

type JsonRpcId = number | string;

type JsonRpcMessage = {
    jsonrpc: "2.0";
    id?: JsonRpcId;
    method?: string;
    params?: unknown;
    result?: unknown;
    error?: unknown;
};

type LspPosition = {
    line: number;
    character: number;
};

type LspRange = {
    start: LspPosition;
    end: LspPosition;
};

type LspTextEdit = {
    newText: string;
    range?: LspRange;
    insert?: LspRange;
    replace?: LspRange;
};

type LspMarkupContent = {
    kind?: "markdown" | "plaintext";
    value?: string;
};

type LspCompletionItemLabel = {
    label: string;
    detail?: string;
    description?: string;
};

type LspCompletionItem = {
    label: string | LspCompletionItemLabel;
    kind?: number;
    detail?: string;
    documentation?: string | LspMarkupContent;
    insertText?: string;
    insertTextFormat?: number;
    filterText?: string;
    sortText?: string;
    textEdit?: LspTextEdit;
    additionalTextEdits?: Array<{
        newText: string;
        range: LspRange;
    }>;
    commitCharacters?: string[];
    data?: unknown;
};

type LspCompletionList = {
    isIncomplete?: boolean;
    items: LspCompletionItem[];
};

type LspHover = {
    contents:
        | string
        | LspMarkupContent
        | Array<string | LspMarkupContent>;
    range?: LspRange;
};

type LspSignatureInformation = {
    label: string;
    documentation?: string | LspMarkupContent;
    parameters?: Array<{
        label: string | [number, number];
        documentation?: string | LspMarkupContent;
    }>;
};

type LspSignatureHelp = {
    signatures: LspSignatureInformation[];
    activeSignature?: number;
    activeParameter?: number;
};

type LspDiagnostic = {
    range: LspRange;
    severity?: number;
    code?: string | number;
    source?: string;
    message: string;
};

type AttachLspOptions = {
    monaco: typeof Monaco;
    editor: Monaco.editor.IStandaloneCodeEditor;
    language: JudgeLanguage;
    fileName: string;
    initialCode: string;
    websocketUrl?: string;
};

type PendingRequest = {
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
};

function toLspLanguage(language: JudgeLanguage): LspLanguage | null {
    switch (language) {
        case "C11":
        case "C++17":
            return "cpp";

        case "Python 3.12":
            return "python";

        case "Java 17":
            return "java";

        case "JavaScript":
            return "javascript";

        case "Dart":
            return "dart";

        case "C# 12":
            return "csharp";

        default:
            return null;
    }
}

function toMonacoLanguage(language: LspLanguage): string {
    switch (language) {
        case "cpp":
            return "cpp";

        case "python":
            return "python";

        case "java":
            return "java";

        case "javascript":
            return "javascript";

        case "dart":
            return "dart";

        case "csharp":
            return "csharp";

        default:
            return "plaintext";
    }
}

function getDefaultFileName(language: LspLanguage): string {
    switch (language) {
        case "cpp":
            return "Main.cpp";

        case "python":
            return "Main.py";

        case "java":
            return "Main.java";

        case "javascript":
            return "Main.js";

        case "dart":
            return "Main.dart";

        case "csharp":
            return "Main.cs";

        default:
            return "Main.txt";
    }
}

function encodePath(fileName: string) {
    return fileName
        .replace(/\\/g, "/")
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");
}

function toWorkspaceUri(language: LspLanguage) {
    return `file:///.lsp-workspace/${language}`;
}

function toFileUri(language: LspLanguage, fileName: string) {
    const safeFileName = fileName || getDefaultFileName(language);
    return `${toWorkspaceUri(language)}/${encodePath(safeFileName)}`;
}

function toMonacoRange(monaco: typeof Monaco, range: LspRange): Monaco.Range {
    return new monaco.Range(
        range.start.line + 1,
        range.start.character + 1,
        range.end.line + 1,
        range.end.character + 1
    );
}

function toMonacoCompletionRange(
    monaco: typeof Monaco,
    textEdit: LspTextEdit | undefined,
    fallbackRange: Monaco.Range
): Monaco.Range | { insert: Monaco.Range; replace: Monaco.Range } {
    if (!textEdit) {
        return fallbackRange;
    }

    if (textEdit.insert && textEdit.replace) {
        return {
            insert: toMonacoRange(monaco, textEdit.insert),
            replace: toMonacoRange(monaco, textEdit.replace)
        };
    }

    if (textEdit.range) {
        return toMonacoRange(monaco, textEdit.range);
    }

    return fallbackRange;
}

function getLabel(label: LspCompletionItem["label"]) {
    if (typeof label === "string") {
        return label;
    }

    return label.label;
}

function toMonacoCompletionLabel(
    label: LspCompletionItem["label"]
): string | Monaco.languages.CompletionItemLabel {
    if (typeof label === "string") {
        return label;
    }

    return {
        label: label.label,
        detail: label.detail,
        description: label.description
    };
}

function getDocumentation(
    documentation?: string | LspMarkupContent
): string | Monaco.IMarkdownString | undefined {
    if (!documentation) {
        return undefined;
    }

    if (typeof documentation === "string") {
        return documentation;
    }

    if (!documentation.value) {
        return undefined;
    }

    return {
        value: documentation.value,
        supportThemeIcons: true,
        supportHtml: false
    };
}

function convertCompletionKind(
    monaco: typeof Monaco,
    kind?: number
): Monaco.languages.CompletionItemKind {
    switch (kind) {
        case 1:
            return monaco.languages.CompletionItemKind.Text;
        case 2:
            return monaco.languages.CompletionItemKind.Method;
        case 3:
            return monaco.languages.CompletionItemKind.Function;
        case 4:
            return monaco.languages.CompletionItemKind.Constructor;
        case 5:
            return monaco.languages.CompletionItemKind.Field;
        case 6:
            return monaco.languages.CompletionItemKind.Variable;
        case 7:
            return monaco.languages.CompletionItemKind.Class;
        case 8:
            return monaco.languages.CompletionItemKind.Interface;
        case 9:
            return monaco.languages.CompletionItemKind.Module;
        case 10:
            return monaco.languages.CompletionItemKind.Property;
        case 11:
            return monaco.languages.CompletionItemKind.Unit;
        case 12:
            return monaco.languages.CompletionItemKind.Value;
        case 13:
            return monaco.languages.CompletionItemKind.Enum;
        case 14:
            return monaco.languages.CompletionItemKind.Keyword;
        case 15:
            return monaco.languages.CompletionItemKind.Snippet;
        case 16:
            return monaco.languages.CompletionItemKind.Color;
        case 17:
            return monaco.languages.CompletionItemKind.File;
        case 18:
            return monaco.languages.CompletionItemKind.Reference;
        case 19:
            return monaco.languages.CompletionItemKind.Folder;
        case 20:
            return monaco.languages.CompletionItemKind.EnumMember;
        case 21:
            return monaco.languages.CompletionItemKind.Constant;
        case 22:
            return monaco.languages.CompletionItemKind.Struct;
        case 23:
            return monaco.languages.CompletionItemKind.Event;
        case 24:
            return monaco.languages.CompletionItemKind.Operator;
        case 25:
            return monaco.languages.CompletionItemKind.TypeParameter;
        default:
            return monaco.languages.CompletionItemKind.Text;
    }
}

function convertDiagnosticSeverity(
    monaco: typeof Monaco,
    severity?: number
): Monaco.MarkerSeverity {
    switch (severity) {
        case 1:
            return monaco.MarkerSeverity.Error;

        case 2:
            return monaco.MarkerSeverity.Warning;

        case 3:
            return monaco.MarkerSeverity.Info;

        case 4:
            return monaco.MarkerSeverity.Hint;

        default:
            return monaco.MarkerSeverity.Info;
    }
}

function getCompletionTriggerCharacters(language: LspLanguage): string[] {
    switch (language) {
        case "cpp":
            return [".", ":", ">", "<", "\"", "'", "/", "#"];

        case "python":
            return [".", " ", "@", "\"", "'"];

        case "java":
            return [".", "(", "<", " ", "@", "\""];

        case "javascript":
            return [".", "(", "[", "'", "\"", "/", "@", "`"];

        case "dart":
            return [".", "(", "[", "'", "\"", "@"];

        case "csharp":
            return [".", "(", "<", " ", "@", "\""];

        default:
            return ["."];
    }
}

function getSignatureTriggerCharacters(language: LspLanguage): string[] {
    switch (language) {
        case "cpp":
            return ["(", ",", "<"];

        case "python":
            return ["(", ","];

        case "java":
            return ["(", ","];

        case "javascript":
            return ["(", ","];

        case "dart":
            return ["(", ","];

        case "csharp":
            return ["(", ","];

        default:
            return ["(", ","];
    }
}

function getInitializeOptions(language: LspLanguage) {
    switch (language) {
        case "javascript":
            return {
                hostInfo: "monaco"
            };

        case "python":
            return {
                settings: {
                    python: {
                        analysis: {
                            typeCheckingMode: "basic",
                            autoSearchPaths: true,
                            useLibraryCodeForTypes: true,
                            diagnosticMode: "openFilesOnly"
                        }
                    }
                }
            };

        case "dart":
            return {
                closingLabels: true,
                outline: true,
                flutterOutline: false
            };

        default:
            return {};
    }
}

function getDidChangeConfigurationSettings(language: LspLanguage) {
    switch (language) {
        case "python":
            return {
                python: {
                    analysis: {
                        typeCheckingMode: "basic",
                        autoSearchPaths: true,
                        useLibraryCodeForTypes: true,
                        diagnosticMode: "openFilesOnly"
                    }
                }
            };

        case "javascript":
            return {
                javascript: {
                    format: {
                        enable: true
                    },
                    preferences: {
                        includePackageJsonAutoImports: "auto"
                    }
                }
            };

        default:
            return {};
    }
}

function getPythonFallbackCompletionItems(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    position: Monaco.Position
): Monaco.languages.CompletionItem[] {
    const word = model.getWordUntilPosition(position);

    const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
    );

    const kind = monaco.languages.CompletionItemKind;
    const snippetRule = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;

    return [
        {
            label: "input",
            kind: kind.Function,
            insertText: "input()",
            detail: "Python builtin",
            range,
            sortText: "000_input"
        },
        {
            label: "print",
            kind: kind.Function,
            insertText: "print(${1:value})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_print"
        },
        {
            label: "map",
            kind: kind.Function,
            insertText: "map(${1:int}, ${2:input().split()})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_map"
        },
        {
            label: "list",
            kind: kind.Function,
            insertText: "list(${1:iterable})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_list"
        },
        {
            label: "range",
            kind: kind.Function,
            insertText: "range(${1:n})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_range"
        },
        {
            label: "len",
            kind: kind.Function,
            insertText: "len(${1:value})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_len"
        },
        {
            label: "enumerate",
            kind: kind.Function,
            insertText: "enumerate(${1:items})",
            insertTextRules: snippetRule,
            detail: "Python builtin",
            range,
            sortText: "000_enumerate"
        },
        {
            label: "sys.stdin.readline",
            kind: kind.Snippet,
            insertText: "sys.stdin.readline().rstrip()",
            detail: "빠른 입력",
            range,
            sortText: "000_sys_stdin"
        },
        {
            label: "import sys",
            kind: kind.Snippet,
            insertText: "import sys",
            detail: "sys import",
            range,
            sortText: "000_import_sys"
        },
        {
            label: "two integers",
            kind: kind.Snippet,
            insertText: "a, b = map(int, input().split())",
            detail: "두 정수 입력",
            range,
            sortText: "000_two_integers"
        },
        {
            label: "integer list",
            kind: kind.Snippet,
            insertText: "arr = list(map(int, input().split()))",
            detail: "정수 배열 입력",
            range,
            sortText: "000_integer_list"
        },
        {
            label: "for loop",
            kind: kind.Snippet,
            insertText: "for ${1:i} in range(${2:n}):\n    ${3:pass}",
            insertTextRules: snippetRule,
            detail: "for loop",
            range,
            sortText: "000_for_loop"
        },
        {
            label: "main",
            kind: kind.Snippet,
            insertText:
                "import sys\ninput = sys.stdin.readline\n\n\ndef main():\n    ${1:pass}\n\n\nif __name__ == \"__main__\":\n    main()",
            insertTextRules: snippetRule,
            detail: "백준 Python main template",
            range,
            sortText: "000_main"
        }
    ];
}

function getFallbackCompletionItems(
    monaco: typeof Monaco,
    language: LspLanguage,
    model: Monaco.editor.ITextModel,
    position: Monaco.Position
): Monaco.languages.CompletionItem[] {
    switch (language) {
        case "python":
            return getPythonFallbackCompletionItems(monaco, model, position);

        default:
            return [];
    }
}

class SimpleLspClient {
    private socket: WebSocket;
    private requestId = 1;

    private pending = new Map<number, PendingRequest>();
    private notificationHandlers = new Map<string, Array<(params: unknown) => void>>();

    private readyPromise: Promise<void>;
    private readyResolve!: () => void;
    private readyReject!: (reason?: unknown) => void;

    private isReady = false;
    private isClosed = false;

    constructor(
        url: string,
        private readonly configurationSettings: unknown = {},
        private readonly workspaceFolders: Array<{ uri: string; name: string }> = []
    ) {
        this.socket = new WebSocket(url);

        this.readyPromise = new Promise((resolve, reject) => {
            this.readyResolve = resolve;
            this.readyReject = reject;
        });

        this.socket.addEventListener("open", () => {
            this.isReady = true;
            this.readyResolve();
        });

        this.socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data) as JsonRpcMessage;

            if (message.id !== undefined && message.method) {
                this.handleServerRequest(message);
                return;
            }

            if (typeof message.id === "number") {
                const pendingRequest = this.pending.get(message.id);

                if (!pendingRequest) {
                    return;
                }

                this.pending.delete(message.id);

                if (message.error) {
                    pendingRequest.reject(message.error);
                } else {
                    pendingRequest.resolve(message.result);
                }

                return;
            }

            if (message.method) {
                const handlers = this.notificationHandlers.get(message.method) ?? [];

                for (const handler of handlers) {
                    handler(message.params);
                }
            }
        });

        this.socket.addEventListener("error", (event) => {
            if (!this.isReady) {
                this.readyReject(event);
            }
        });

        this.socket.addEventListener("close", () => {
            this.isClosed = true;

            if (!this.isReady) {
                this.readyReject(new Error("LSP socket closed before open"));
            }

            for (const [, pendingRequest] of this.pending) {
                pendingRequest.reject(new Error("LSP socket closed"));
            }

            this.pending.clear();
        });
    }

    private sendMessage(message: JsonRpcMessage) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        this.socket.send(JSON.stringify(message));
    }

    private sendResponse(id: JsonRpcId, result: unknown) {
        this.sendMessage({
            jsonrpc: "2.0",
            id,
            result
        });
    }

    private sendErrorResponse(id: JsonRpcId, code: number, message: string) {
        this.sendMessage({
            jsonrpc: "2.0",
            id,
            error: {
                code,
                message
            }
        });
    }

    private handleServerRequest(message: JsonRpcMessage) {
        if (message.id === undefined || !message.method) {
            return;
        }

        try {
            switch (message.method) {
                case "workspace/configuration": {
                    const params = message.params as
                        | {
                        items?: Array<{
                            section?: string;
                        }>;
                    }
                        | undefined;

                    const items = params?.items ?? [];

                    this.sendResponse(
                        message.id,
                        items.map(() => this.configurationSettings ?? {})
                    );
                    return;
                }

                case "workspace/workspaceFolders":
                    this.sendResponse(message.id, this.workspaceFolders);
                    return;

                case "client/registerCapability":
                case "client/unregisterCapability":
                case "window/workDoneProgress/create":
                    this.sendResponse(message.id, null);
                    return;

                default:
                    this.sendResponse(message.id, null);
                    return;
            }
        } catch (error) {
            this.sendErrorResponse(
                message.id,
                -32603,
                error instanceof Error ? error.message : "Internal client error"
            );
        }
    }

    async waitUntilReady() {
        if (this.isClosed) {
            throw new Error("LSP socket already closed");
        }

        await this.readyPromise;
    }

    onNotification(method: string, handler: (params: unknown) => void) {
        const handlers = this.notificationHandlers.get(method) ?? [];
        handlers.push(handler);
        this.notificationHandlers.set(method, handlers);

        return {
            dispose: () => {
                const currentHandlers = this.notificationHandlers.get(method) ?? [];
                this.notificationHandlers.set(
                    method,
                    currentHandlers.filter((item) => item !== handler)
                );
            }
        };
    }

    async request(method: string, params?: unknown) {
        await this.waitUntilReady();

        const id = this.requestId++;

        const message = {
            jsonrpc: "2.0" as const,
            id,
            method,
            params
        };

        return new Promise<unknown>((resolve, reject) => {
            this.pending.set(id, {
                resolve,
                reject
            });

            this.socket.send(JSON.stringify(message));
        });
    }

    notify(method: string, params?: unknown) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        const message = {
            jsonrpc: "2.0" as const,
            method,
            params
        };

        this.socket.send(JSON.stringify(message));
    }

    close() {
        if (
            this.socket.readyState === WebSocket.OPEN ||
            this.socket.readyState === WebSocket.CONNECTING
        ) {
            this.socket.close();
        }

        this.pending.clear();
        this.notificationHandlers.clear();
    }
}

export function attachJudgeLspToMonaco(options: AttachLspOptions) {
    const {
        monaco,
        editor,
        language,
        fileName,
        initialCode,
        websocketUrl = "ws://localhost:4001/lsp"
    } = options;

    const lspLanguage = toLspLanguage(language);

    if (!lspLanguage) {
        return {
            dispose() {}
        };
    }

    const monacoLanguage = toMonacoLanguage(lspLanguage);
    const rootUri = toWorkspaceUri(lspLanguage);
    const fileUri = toFileUri(lspLanguage, fileName);
    const markerOwner = `judge-lsp-${lspLanguage}`;

    const workspaceFolders = [
        {
            uri: rootUri,
            name: `boj-${lspLanguage}-workspace`
        }
    ];

    const client = new SimpleLspClient(
        `${websocketUrl}?language=${encodeURIComponent(lspLanguage)}`,
        getDidChangeConfigurationSettings(lspLanguage),
        workspaceFolders
    );

    let version = 1;
    let initialized = false;
    let disposed = false;
    let changeTimer: ReturnType<typeof setTimeout> | null = null;

    const disposables: Monaco.IDisposable[] = [];

    async function initialize() {
        await client.waitUntilReady();

        if (disposed) {
            return;
        }

        await client.request("initialize", {
            processId: null,
            rootUri,
            rootPath: null,
            capabilities: {
                textDocument: {
                    synchronization: {
                        dynamicRegistration: false,
                        didSave: true,
                        willSave: false,
                        willSaveWaitUntil: false
                    },
                    completion: {
                        dynamicRegistration: false,
                        contextSupport: true,
                        completionItem: {
                            snippetSupport: true,
                            commitCharactersSupport: true,
                            documentationFormat: ["markdown", "plaintext"],
                            deprecatedSupport: true,
                            preselectSupport: true,
                            insertReplaceSupport: true,
                            labelDetailsSupport: true,
                            resolveSupport: {
                                properties: [
                                    "documentation",
                                    "detail",
                                    "additionalTextEdits"
                                ]
                            }
                        }
                    },
                    hover: {
                        dynamicRegistration: false,
                        contentFormat: ["markdown", "plaintext"]
                    },
                    signatureHelp: {
                        dynamicRegistration: false,
                        signatureInformation: {
                            documentationFormat: ["markdown", "plaintext"],
                            parameterInformation: {
                                labelOffsetSupport: true
                            }
                        }
                    },
                    definition: {
                        dynamicRegistration: false,
                        linkSupport: true
                    },
                    typeDefinition: {
                        dynamicRegistration: false,
                        linkSupport: true
                    },
                    implementation: {
                        dynamicRegistration: false,
                        linkSupport: true
                    },
                    documentSymbol: {
                        dynamicRegistration: false,
                        hierarchicalDocumentSymbolSupport: true
                    },
                    publishDiagnostics: {
                        relatedInformation: true,
                        versionSupport: false,
                        codeDescriptionSupport: true,
                        dataSupport: true
                    }
                },
                workspace: {
                    workspaceFolders: true,
                    configuration: true,
                    didChangeConfiguration: {
                        dynamicRegistration: false
                    }
                },
                window: {
                    workDoneProgress: true
                }
            },
            initializationOptions: getInitializeOptions(lspLanguage),
            workspaceFolders
        });

        if (disposed) {
            return;
        }

        client.notify("initialized", {});

        client.notify("workspace/didChangeConfiguration", {
            settings: getDidChangeConfigurationSettings(lspLanguage)
        });

        client.notify("textDocument/didOpen", {
            textDocument: {
                uri: fileUri,
                languageId: monacoLanguage,
                version,
                text: initialCode
            }
        });

        initialized = true;
    }

    const initializedPromise = initialize().catch((error) => {
        console.error(`[${lspLanguage} LSP initialize failed]`, error);
    });

    const diagnosticsDisposable = client.onNotification(
        "textDocument/publishDiagnostics",
        (params) => {
            const payload = params as {
                uri?: string;
                diagnostics?: LspDiagnostic[];
            };

            if (!payload.uri || payload.uri !== fileUri) {
                return;
            }

            const model = editor.getModel();

            if (!model) {
                return;
            }

            const markers: Monaco.editor.IMarkerData[] = (payload.diagnostics ?? []).map(
                (diagnostic) => ({
                    severity: convertDiagnosticSeverity(monaco, diagnostic.severity),
                    message: diagnostic.message,
                    source: diagnostic.source,
                    code:
                        diagnostic.code === undefined
                            ? undefined
                            : String(diagnostic.code),
                    startLineNumber: diagnostic.range.start.line + 1,
                    startColumn: diagnostic.range.start.character + 1,
                    endLineNumber: diagnostic.range.end.line + 1,
                    endColumn: diagnostic.range.end.character + 1
                })
            );

            monaco.editor.setModelMarkers(model, markerOwner, markers);
        }
    );

    const changeDisposable = editor.onDidChangeModelContent(() => {
        const model = editor.getModel();

        if (!model || disposed) {
            return;
        }

        version++;

        if (changeTimer) {
            clearTimeout(changeTimer);
        }

        changeTimer = setTimeout(() => {
            if (!initialized || disposed) {
                return;
            }

            client.notify("textDocument/didChange", {
                textDocument: {
                    uri: fileUri,
                    version
                },
                contentChanges: [
                    {
                        text: model.getValue()
                    }
                ]
            });
        }, 120);
    });

    disposables.push(changeDisposable);

    const completionDisposable = monaco.languages.registerCompletionItemProvider(
        monacoLanguage,
        {
            triggerCharacters: getCompletionTriggerCharacters(lspLanguage),

            async provideCompletionItems(
                model: Monaco.editor.ITextModel,
                position: Monaco.Position
            ): Promise<Monaco.languages.CompletionList> {
                const currentModel = editor.getModel();

                if (!currentModel || model.uri.toString() !== currentModel.uri.toString()) {
                    return {
                        suggestions: []
                    };
                }

                const fallbackSuggestions = getFallbackCompletionItems(
                    monaco,
                    lspLanguage,
                    model,
                    position
                );

                await initializedPromise;

                if (!initialized || disposed) {
                    return {
                        suggestions: fallbackSuggestions
                    };
                }

                try {
                    const result = await client.request("textDocument/completion", {
                        textDocument: {
                            uri: fileUri
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        },
                        context: {
                            triggerKind: 1
                        }
                    });

                    const items = Array.isArray(result)
                        ? result
                        : (result as LspCompletionList | null)?.items ?? [];

                    const word = model.getWordUntilPosition(position);

                    const fallbackRange = new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    );

                    const lspSuggestions = items.map((item) => {
                        const lspItem = item as LspCompletionItem;
                        const labelText = getLabel(lspItem.label);
                        const insertText =
                            lspItem.textEdit?.newText ??
                            lspItem.insertText ??
                            labelText;

                        return {
                            label: toMonacoCompletionLabel(lspItem.label),
                            kind: convertCompletionKind(monaco, lspItem.kind),
                            detail: lspItem.detail,
                            documentation: getDocumentation(lspItem.documentation),
                            insertText,
                            insertTextRules:
                                lspItem.insertTextFormat === 2
                                    ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                    : undefined,
                            range: toMonacoCompletionRange(
                                monaco,
                                lspItem.textEdit,
                                fallbackRange
                            ),
                            additionalTextEdits: lspItem.additionalTextEdits?.map((edit) => ({
                                range: toMonacoRange(monaco, edit.range),
                                text: edit.newText
                            })),
                            commitCharacters: lspItem.commitCharacters,
                            sortText: lspItem.sortText ?? labelText,
                            filterText: lspItem.filterText ?? labelText,
                            preselect: false,
                            __lspItem: lspItem
                        } as Monaco.languages.CompletionItem & {
                            __lspItem: LspCompletionItem;
                        };
                    });

                    return {
                        suggestions:
                            lspLanguage === "python"
                                ? [...fallbackSuggestions, ...lspSuggestions]
                                : lspSuggestions.length > 0
                                    ? lspSuggestions
                                    : fallbackSuggestions
                    };
                } catch (error) {
                    console.warn(`[${lspLanguage} LSP completion failed]`, error);

                    return {
                        suggestions: fallbackSuggestions
                    };
                }
            },

            async resolveCompletionItem(item) {
                const lspItem = (item as Monaco.languages.CompletionItem & {
                    __lspItem?: LspCompletionItem;
                }).__lspItem;

                if (!lspItem || disposed) {
                    return item;
                }

                await initializedPromise;

                if (!initialized || disposed) {
                    return item;
                }

                try {
                    const resolved = (await client.request(
                        "completionItem/resolve",
                        lspItem
                    )) as LspCompletionItem;

                    if (resolved.detail) {
                        item.detail = resolved.detail;
                    }

                    if (resolved.documentation) {
                        item.documentation = getDocumentation(resolved.documentation);
                    }

                    if (resolved.additionalTextEdits) {
                        item.additionalTextEdits = resolved.additionalTextEdits.map(
                            (edit) => ({
                                range: toMonacoRange(monaco, edit.range),
                                text: edit.newText
                            })
                        );
                    }
                } catch {
                    return item;
                }

                return item;
            }
        }
    );

    disposables.push(completionDisposable);

    const hoverDisposable = monaco.languages.registerHoverProvider(monacoLanguage, {
        async provideHover(model, position) {
            const currentModel = editor.getModel();

            if (!currentModel || model.uri.toString() !== currentModel.uri.toString()) {
                return undefined;
            }

            await initializedPromise;

            if (!initialized || disposed) {
                return undefined;
            }

            try {
                const result = (await client.request("textDocument/hover", {
                    textDocument: {
                        uri: fileUri
                    },
                    position: {
                        line: position.lineNumber - 1,
                        character: position.column - 1
                    }
                })) as LspHover | null;

                if (!result || !result.contents) {
                    return undefined;
                }

                const contents = Array.isArray(result.contents)
                    ? result.contents
                    : [result.contents];

                return {
                    range: result.range
                        ? toMonacoRange(monaco, result.range)
                        : undefined,
                    contents: contents
                        .map((content) => {
                            if (typeof content === "string") {
                                return {
                                    value: content
                                };
                            }

                            return {
                                value: content.value ?? ""
                            };
                        })
                        .filter((content) => content.value.length > 0)
                };
            } catch {
                return undefined;
            }
        }
    });

    disposables.push(hoverDisposable);

    const signatureDisposable = monaco.languages.registerSignatureHelpProvider(
        monacoLanguage,
        {
            signatureHelpTriggerCharacters: getSignatureTriggerCharacters(lspLanguage),

            async provideSignatureHelp(model, position) {
                const currentModel = editor.getModel();

                if (!currentModel || model.uri.toString() !== currentModel.uri.toString()) {
                    return undefined;
                }

                await initializedPromise;

                if (!initialized || disposed) {
                    return undefined;
                }

                try {
                    const result = (await client.request("textDocument/signatureHelp", {
                        textDocument: {
                            uri: fileUri
                        },
                        position: {
                            line: position.lineNumber - 1,
                            character: position.column - 1
                        },
                        context: {
                            triggerKind: 1,
                            isRetrigger: false
                        }
                    })) as LspSignatureHelp | null;

                    if (!result || result.signatures.length === 0) {
                        return undefined;
                    }

                    return {
                        value: {
                            signatures: result.signatures.map((signature) => ({
                                label: signature.label,
                                documentation: getDocumentation(signature.documentation),
                                parameters:
                                    signature.parameters?.map((parameter) => ({
                                        label: parameter.label,
                                        documentation: getDocumentation(parameter.documentation)
                                    })) ?? []
                            })),
                            activeSignature: result.activeSignature ?? 0,
                            activeParameter: result.activeParameter ?? 0
                        },
                        dispose() {}
                    };
                } catch {
                    return undefined;
                }
            }
        }
    );

    disposables.push(signatureDisposable);

    return {
        dispose() {
            disposed = true;

            if (changeTimer) {
                clearTimeout(changeTimer);
            }

            const model = editor.getModel();

            if (model) {
                monaco.editor.setModelMarkers(model, markerOwner, []);
            }

            if (initialized) {
                client.notify("textDocument/didClose", {
                    textDocument: {
                        uri: fileUri
                    }
                });
            }

            diagnosticsDisposable.dispose();
            client.close();

            for (const disposable of disposables) {
                disposable.dispose();
            }
        }
    };
}