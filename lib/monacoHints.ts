import type * as Monaco from "monaco-editor";

let registered = false;

const cppIncludes = [
    "bits/stdc++.h",
    "iostream",
    "vector",
    "queue",
    "stack",
    "deque",
    "set",
    "map",
    "unordered_set",
    "unordered_map",
    "algorithm",
    "string",
    "sstream",
    "cmath",
    "climits",
    "cstring",
    "numeric",
    "tuple",
    "utility",
    "functional",
    "iomanip"
];

const javaImports = [
    "java.io.*",
    "java.io.BufferedReader",
    "java.io.InputStreamReader",
    "java.io.IOException",
    "java.util.*",
    "java.util.StringTokenizer",
    "java.util.ArrayList",
    "java.util.Arrays",
    "java.util.Collections",
    "java.util.Comparator",
    "java.util.HashMap",
    "java.util.HashSet",
    "java.util.LinkedList",
    "java.util.PriorityQueue",
    "java.util.Queue",
    "java.util.Stack",
    "java.util.TreeMap",
    "java.util.TreeSet"
];

function createRange(
    model: Monaco.editor.ITextModel,
    position: Monaco.Position
): Monaco.IRange {
    const word = model.getWordUntilPosition(position);

    return {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
    };
}

export function registerJudgeLanguageHints(monaco: typeof Monaco) {
    if (registered) return;
    registered = true;

    monaco.languages.registerCompletionItemProvider("cpp", {
        triggerCharacters: ["#", "<", '"'],
        provideCompletionItems(model, position) {
            const line = model.getLineContent(position.lineNumber);
            const prefix = line.slice(0, position.column - 1);
            const range = createRange(model, position);

            const isIncludeLine =
                prefix.trimStart().startsWith("#") ||
                prefix.includes("#include");

            if (!isIncludeLine) {
                return {
                    suggestions: []
                };
            }

            return {
                suggestions: [
                    {
                        label: "boj main template",
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            "#include <bits/stdc++.h>",
                            "using namespace std;",
                            "",
                            "int main() {",
                            "    ios::sync_with_stdio(false);",
                            "    cin.tie(nullptr);",
                            "",
                            "    $0",
                            "",
                            "    return 0;",
                            "}"
                        ].join("\n"),
                        insertTextRules:
                        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: "BOJ C++ Template",
                        documentation: "백준용 C++ 기본 템플릿입니다.",
                        range
                    },
                    {
                        label: "#include <bits/stdc++.h>",
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: "#include <bits/stdc++.h>",
                        detail: "C++ Competitive Programming Header",
                        documentation: "백준/코딩테스트에서 자주 사용하는 통합 헤더입니다.",
                        range
                    },
                    ...cppIncludes.map((header) => ({
                        label: header,
                        kind: monaco.languages.CompletionItemKind.Module,
                        insertText: `#include <${header}>`,
                        detail: "C++ Header",
                        documentation: `${header} 헤더를 추가합니다.`,
                        range
                    }))
                ]
            };
        }
    });

    monaco.languages.registerCompletionItemProvider("java", {
        triggerCharacters: ["i", ".", "*"],
        provideCompletionItems(model, position) {
            const line = model.getLineContent(position.lineNumber);
            const prefix = line.slice(0, position.column - 1);
            const range = createRange(model, position);

            const isImportLine =
                prefix.trimStart().startsWith("import") ||
                prefix.trim() === "im" ||
                prefix.trim() === "imp";

            if (!isImportLine) {
                return {
                    suggestions: []
                };
            }

            return {
                suggestions: javaImports.map((importName) => ({
                    label: `import ${importName};`,
                    kind: monaco.languages.CompletionItemKind.Module,
                    insertText: `import ${importName};`,
                    detail: "Java Import",
                    documentation: `${importName} 패키지 또는 클래스를 import합니다.`,
                    range
                }))
            };
        }
    });
}