import path from "path";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { ApolloServer } from "apollo-server-express";
import { PrismaClient } from "@prisma/client";
import { resolvers } from "../prisma/generated/type-graphql";
import express, { json } from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

interface Context {
  prisma: PrismaClient;
}

async function main() {
  const schema = await buildSchema({
    resolvers,
    emitSchemaFile: path.resolve(__dirname, "graphql/schema.graphql"),
    validate: false,
  });

  const prisma = new PrismaClient();
  await prisma.$connect();

  const server = new ApolloServer({
    schema,
    context: (): Context => ({ prisma }),
  });

  const app = express();
  app.use(morgan("tiny"));
  app.use(json());
  app.use(cookieParser());

  const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
      return res.sendStatus(403);
    }
    try {
      const user = jwt.verify(token, "secret");
      req.user = user;
      return next();
    } catch {
      return res.sendStatus(403);
    }
  };

  app.post("/login", (req, res) => {
    const payload = req.body.username;
    const token = jwt.sign({ payload }, "secret", { expiresIn: "16h" });
    return res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({ message: "logged in successfully !" });
  });

  app.use(express.static("public"));

  // app.use(authorization);

  app.get("hello", (req, res) => {
    return res.json({ message: "hello" });
  });

  await server.start();
  server.applyMiddleware({ app });

  const port = 4000;

  app.listen({ port }, () =>
    console.log(`GraphQL is listening on ${port}/${server.graphqlPath}!`)
  );
}

main().catch(console.error);
