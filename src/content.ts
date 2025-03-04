console.log("Content script loaded");

const mount = document.createElement("div");
mount.id = "chrome-extension-root";
document.body.appendChild(mount);
