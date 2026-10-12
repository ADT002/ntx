import fs from "fs/promises";
import path from "path";

const SESSION_DIR = path.join(
    process.cwd(),
    "data",
    "shopee"
);

const SESSION_FILE = path.join(
    SESSION_DIR,
    "session.json"
);

export async function ensureSessionDirectory() {
    await fs.mkdir(SESSION_DIR, {
        recursive: true,
    });
}

export async function saveSession(
    storageState: object
) {
    await ensureSessionDirectory();

    await fs.writeFile(
        SESSION_FILE,
        JSON.stringify(storageState, null, 2),
        "utf-8"
    );
}

export async function loadSession(): Promise<string | undefined> {
    try {
        await fs.access(SESSION_FILE);

        return SESSION_FILE;
    } catch {
        return undefined;
    }
}

export async function getSessionData() {
    try {
        const content = await fs.readFile(
            SESSION_FILE,
            "utf-8"
        );

        return JSON.parse(content);
    } catch {
        return null;
    }
}

export async function hasSession(): Promise<boolean> {
    try {
        await fs.access(SESSION_FILE);

        return true;
    } catch {
        return false;
    }
}

export async function deleteSession() {
    try {
        await fs.unlink(SESSION_FILE);
    } catch {
        // Không có session thì bỏ qua
    }
}

export function getSessionPath() {
    return SESSION_FILE;
}