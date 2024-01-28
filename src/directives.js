const { SchemaDirectiveVisitor, AuthenticationError } = require("apollo-server");
const { defaultFieldResolver, GraphQLString } = require("graphql");
const { formatDate } = require("./utils");

// static parameters
/* class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { message } = this.args;
    field.resolve = (...args) => {
      console.log(`You got a a message from the log directive: ${message}`);
      console.log(field);
      return resolver.apply(this, args);
    };
  }
} */

// dynamic parameters: defined at query time
class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { message: schemaMessage } = this.args;
    field.args.push({
      type: GraphQLString,
      name: "message",
    });
    field.resolve = (object, { message, ...rest }, ctx, info) => {
      console.log(`You got a a message from the log directive: ${message || schemaMessage}`);
      return resolver.call(this, object, rest, ctx, info);
    };
  }
}

// not the best solution...
// this solution doesn't work for non-leaf resolvers in the resolver chain
/* class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { format } = this.args;
    field.resolve = (object) => {
      const { createdAt } = object;
      return formatDate(createdAt, format);
    };
  }
} */

class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { format: defaultFormat } = this.args;

    field.args.push({ type: GraphQLString, name: "format" });

    field.resolve = async (object, { format, ...rest }, ctx, info) => {
      const createdAt = await resolver.call(this, object, rest, ctx, info);
      return formatDate(createdAt, format || defaultFormat);
    };
  }
}

class AuthenticateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.resolve = async (object, args, ctx, info) => {
      const { user } = ctx;
      if (user) return resolver(object, args, ctx, info);
      else throw new AuthenticationError("not authenticated");
    };
  }
}

class AuthorizeDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { role } = this.args;
    field.resolve = async (object, args, ctx, info) => {
      const { user } = ctx;
      if (user.role === role) return resolver(object, args, ctx, info);
      else throw new AuthenticationError("unauthorized");
    };
  }
}

exports.LogDirective = LogDirective;
exports.DateFormatDirective = DateFormatDirective;
exports.AuthenticateDirective = AuthenticateDirective;
exports.AuthorizeDirective = AuthorizeDirective;
