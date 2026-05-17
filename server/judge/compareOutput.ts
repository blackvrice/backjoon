// src/server/judge/compareOutput.ts

export type OutputCompareMode = "default" | "exact" | "token";

/**
 * 기본 출력 정규화
 *
 * 백준 스타일에 가깝게:
 * - Windows 개행 CRLF를 LF로 변환
 * - 각 줄 오른쪽 공백 제거
 * - 전체 출력 마지막 공백/개행 제거
 *
 * 단, 줄 앞쪽 공백은 보존합니다.
 */
export function normalizeOutput(value: string): string {
    return String(value ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .trimEnd();
}

/**
 * 완전 동일 비교
 *
 * 개행, 공백까지 모두 같아야 합니다.
 */
export function compareExactOutput(
    userOutput: string,
    answerOutput: string,
): boolean {
    return String(userOutput ?? "") === String(answerOutput ?? "");
}

/**
 * 기본 비교
 *
 * 일반적인 알고리즘 문제 채점에 적합합니다.
 */
export function compareDefaultOutput(
    userOutput: string,
    answerOutput: string,
): boolean {
    return normalizeOutput(userOutput) === normalizeOutput(answerOutput);
}

/**
 * 토큰 비교
 *
 * 공백, 개행 차이를 거의 무시합니다.
 * 예:
 * "1 2 3"
 * "1\n2\n3"
 * 를 같은 출력으로 봅니다.
 */
export function compareTokenOutput(
    userOutput: string,
    answerOutput: string,
): boolean {
    const userTokens = tokenizeOutput(userOutput);
    const answerTokens = tokenizeOutput(answerOutput);

    if (userTokens.length !== answerTokens.length) {
        return false;
    }

    for (let i = 0; i < answerTokens.length; i++) {
        if (userTokens[i] !== answerTokens[i]) {
            return false;
        }
    }

    return true;
}

/**
 * 출력 비교 메인 함수
 */
export function compareOutput(
    userOutput: string,
    answerOutput: string,
    mode: OutputCompareMode = "default",
): boolean {
    switch (mode) {
        case "exact":
            return compareExactOutput(userOutput, answerOutput);

        case "token":
            return compareTokenOutput(userOutput, answerOutput);

        case "default":
        default:
            return compareDefaultOutput(userOutput, answerOutput);
    }
}

/**
 * 오답일 때 디버깅용 메시지를 만들 때 사용합니다.
 */
export function createOutputDiffMessage(
    userOutput: string,
    answerOutput: string,
): string {
    const normalizedUser = normalizeOutput(userOutput);
    const normalizedAnswer = normalizeOutput(answerOutput);

    const userLines = normalizedUser.length > 0 ? normalizedUser.split("\n") : [""];
    const answerLines =
        normalizedAnswer.length > 0 ? normalizedAnswer.split("\n") : [""];

    const maxLineCount = Math.max(userLines.length, answerLines.length);

    for (let i = 0; i < maxLineCount; i++) {
        const userLine = userLines[i] ?? "";
        const answerLine = answerLines[i] ?? "";

        if (userLine !== answerLine) {
            return [
                `${i + 1}번째 줄에서 출력이 다릅니다.`,
                `정답: ${truncateForMessage(answerLine)}`,
                `출력: ${truncateForMessage(userLine)}`,
            ].join("\n");
        }
    }

    return "출력이 다릅니다.";
}

function tokenizeOutput(value: string): string[] {
    const trimmed = String(value ?? "").trim();

    if (!trimmed) {
        return [];
    }

    return trimmed.split(/\s+/);
}

function truncateForMessage(value: string, maxLength = 300): string {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength)}...`;
}
