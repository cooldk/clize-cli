# Runs the Clize MCP server (clize-mcp) from the published npm package.
# Used by MCP directories (e.g. Glama) to verify the server starts and
# responds to introspection. No credentials are baked in: tools that touch
# the control plane ask you to log in at runtime.
FROM node:22-slim
RUN npm install -g @clize/clize
ENTRYPOINT ["clize-mcp"]
