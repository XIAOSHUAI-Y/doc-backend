import * as Y from 'yjs';
export declare function saveUpdate(docId: string, update: Uint8Array): Promise<void>;
export declare function loadDocument(docId: string, doc: Y.Doc): Promise<number>;
export declare function disconnectPrisma(): Promise<void>;
