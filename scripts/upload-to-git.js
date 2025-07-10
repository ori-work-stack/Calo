const { execSync } = require("child_process");
const readline = require("readline");

// Helper to run shell commands
const runCommand = (command) => {
  try {
    const output = execSync(command, { stdio: "inherit" });
    return output?.toString().trim();
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    process.exit(1);
  }
};

// Prompt user for a commit message
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📝 Enter your commit message: ", (commitMessage) => {
  console.log("📦 Staging all changes...");
  runCommand("git add .");

  console.log(`✅ Committing with message: "${commitMessage}"`);
  runCommand(`git commit -m "${commitMessage}"`);

  console.log("🚀 Pushing to origin...");
  runCommand("git push origin");

  console.log("✅ Upload complete.");
  rl.close();
});
