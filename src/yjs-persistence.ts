import { PrismaClient } from '@prisma/client'
import * as Y from 'yjs'

const prisma = new PrismaClient()

/**
 * 保存 Yjs update 到数据库
 */
export async function saveUpdate(docId: string, update: Uint8Array): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 确保文档记录存在
    await tx.yjsDocument.upsert({
      where: { docId },
      create: { docId, name: docId },
      update: { updatedAt: new Date() }
    })

    // 获取下一个版本号
    const lastUpdate = await tx.yjsUpdate.findFirst({
      where: { docId },
      orderBy: { version: 'desc' }
    })
    const version = (lastUpdate?.version ?? -1) + 1

    // 插入 update
    await tx.yjsUpdate.create({
      data: {
        docId,
        update: Buffer.from(update),
        version
      }
    })
  })
}

/**
 * 从数据库加载所有 updates 并应用到 Y.Doc
 */
export async function loadDocument(docId: string, doc: Y.Doc): Promise<number> {
  const updates = await prisma.yjsUpdate.findMany({
    where: { docId },
    orderBy: { version: 'asc' }
  })

  updates.forEach(u => {
    Y.applyUpdate(doc, new Uint8Array(u.update))
  })

  return updates.length
}

/**
 * 关闭 Prisma 连接（应用退出时调用）
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}
