// scripts/update-ip-env.js

const fs = require("fs");
const os = require("os");
const path = require("path");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (
        iface.family === "IPv4" &&
        !iface.internal &&
        (iface.address.startsWith("192.") || iface.address.startsWith("10."))
      ) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // fallback
}

const ip = getLocalIp();
const clientEnvPath = path.resolve(__dirname, "../client/.env");
const serverEnvPath = path.resolve(__dirname, "../server/.env");

function updateEnvValue(filePath, key, newValue) {
  if (!fs.existsSync(filePath)) {
    console.warn(`❗️File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const regex = new RegExp(`^${key}=.*`, "m");

  const updatedLine = `${key}=${newValue}`;
  if (regex.test(content)) {
    content = content.replace(regex, updatedLine);
  } else {
    content += `\n${updatedLine}`;
  }

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ Updated ${key} in ${filePath}`);
}

// Update both env files
updateEnvValue(clientEnvPath, "EXPO_PUBLIC_API_URL", `http://${ip}:5000/api`);
updateEnvValue(serverEnvPath, "API_BASE_URL", `http://${ip}:5000/api`);
