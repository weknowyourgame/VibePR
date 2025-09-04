import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/", (req: FastifyRequest, res: FastifyReply) => {
  res.send("Hello World");
});

app.listen({ port: 3000 }, (err: Error | null, address: string) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`server is running on ${address}`);
});