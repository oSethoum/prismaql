import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();
  await prisma.student.create({
    data: {
      grade: 1,
      user: {
        create: {
          firstName: "oussama",
          lastName: "benhaddou",
          password: "123456",
          picture: "okay",
          username: "osethoum",
          role: "student",
        },
      },
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
