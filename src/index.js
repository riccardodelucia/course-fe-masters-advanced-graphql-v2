const { ApolloServer, SchemaDirectiveVisitor } = require("apollo-server");
const typeDefs = require("./typedefs");
const resolvers = require("./resolvers");
const { createToken, getUserFromToken } = require("./auth");
const db = require("./db");
const { LogDirective, DateFormatDirective, AuthenticateDirective, AuthorizeDirective } = require("./directives");

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError(e) {
    console.log(e);
    return e;
  },
  schemaDirectives: {
    log: LogDirective,
    date_format: DateFormatDirective,
    authenticate: AuthenticateDirective,
    authorize: AuthorizeDirective,
  },
  context({ req, connection }) {
    if (connection) return { ...db, ...connection.context };

    const token = req.headers.authorization;
    const user = getUserFromToken(token);
    return { ...db, user, createToken };
  },
  subscriptions: {
    onConnect(params) {
      const token = params.authToken;
      const user = getUserFromToken(token);
      if (!user) {
        throw new Error("nope");
      }
      return { user };
    },
  },
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
