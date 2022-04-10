import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import path from "path";
import { PrismaClient } from "@prisma/client";
import Express from "express";
import { resolvers } from "../prisma/generated/type-graphql";

interface Context {
  prisma: PrismaClient;
}

async function main() {
  const schema = await buildSchema({
    resolvers,
    emitSchemaFile: path.resolve(__dirname, "./generated-schema.graphql"),
    validate: false,
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  const server = new ApolloServer({
    schema,
    context: (): Context => ({ prisma }),
  });

  const app = Express();

  await server.start();
  server.applyMiddleware({ app });

  const port = 4000;

  app.listen({ port }, () =>
    console.log(`GraphQL is listening on ${port}/${server.graphqlPath}!`)
  );
}

main().catch(console.error);
