"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveUpdate = saveUpdate;
exports.loadDocument = loadDocument;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
const Y = __importStar(require("yjs"));
const prisma = new client_1.PrismaClient();
async function saveUpdate(docId, update) {
    await prisma.$transaction(async (tx) => {
        await tx.yjsDocument.upsert({
            where: { docId },
            create: { docId, name: docId },
            update: { updatedAt: new Date() }
        });
        const lastUpdate = await tx.yjsUpdate.findFirst({
            where: { docId },
            orderBy: { version: 'desc' }
        });
        const version = (lastUpdate?.version ?? -1) + 1;
        await tx.yjsUpdate.create({
            data: {
                docId,
                update: Buffer.from(update),
                version
            }
        });
    });
}
async function loadDocument(docId, doc) {
    const updates = await prisma.yjsUpdate.findMany({
        where: { docId },
        orderBy: { version: 'asc' }
    });
    updates.forEach(u => {
        Y.applyUpdate(doc, new Uint8Array(u.update));
    });
    return updates.length;
}
async function disconnectPrisma() {
    await prisma.$disconnect();
}
//# sourceMappingURL=yjs-persistence.js.map