// Block installation with npm or pnpm — this project requires Yarn.
// The "npm_config_user_agent" env var identifies the package manager running the install.

const agent = process.env.npm_config_user_agent || '';

if (!agent.startsWith('yarn')) {
  console.error(
    '\n\x1b[31mThis project requires Yarn.\x1b[0m\n\n' +
    '  Run \x1b[36myarn install\x1b[0m instead.\n\n' +
    '  If you don\'t have Yarn, enable it via Corepack:\n' +
    '  \x1b[36mcorepack enable\x1b[0m\n'
  );
  process.exit(1);
}
