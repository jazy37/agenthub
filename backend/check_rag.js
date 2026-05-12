const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const agent = await prisma.agent.findUnique({
    where: { id: '3c5a6eb7-7556-4baa-b062-88c1d70e414f' },
    include: { documents: true }
  });
  console.log(JSON.stringify(agent, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
