const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const agentId = '0b427c66-4182-41d4-8d3d-40d17df88e7a';
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  console.log(`Agent RAG Enabled: ${agent.ragEnabled}`);
  process.exit();
}
check();
