// Szybki skrypt do sprawdzenia zawartości bazy danych
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('📊 Sprawdzanie bazy danych...\n');

    const users = await prisma.user.findMany();

    console.log(`👥 Liczba użytkowników: ${users.length}\n`);

    if (users.length > 0) {
      console.log('Lista użytkowników:');
      console.log('==================');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Plan: ${user.plan}`);
        console.log(`   Utworzony: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ Baza danych jest pusta');
    }
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
