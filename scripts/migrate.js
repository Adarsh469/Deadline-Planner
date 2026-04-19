#!/usr/bin/env node
/**
 * Minimal migration runner that uses @prisma/migrate directly.
 * This avoids needing the full prisma CLI with its heavy dependencies.
 */
const { MigrateDeployCommand } = require("@prisma/migrate");

async function main() {
    const command = new MigrateDeployCommand();
    const result = await command.parse(["--schema", "/app/prisma/schema.prisma"]);
    if (result) {
        console.log(result);
    }
    process.exit(0);
}

main().catch((e) => {
    console.error("Migration failed:", e.message || e);
    process.exit(1);
});
