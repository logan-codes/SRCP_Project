const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');

function sanitizeLogs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            sanitizeLogs(fullPath);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Replace console.error(error); with console.error("Error:", error.message);
            if (content.includes('console.error(error);')) {
                content = content.replace(/console\.error\(error\);/g, 'console.error("Error:", error.message || error);');
                modified = true;
            }

            // Replace console.error(err); with console.error("Error:", err.message);
            if (content.includes('console.error(err);')) {
                content = content.replace(/console\.error\(err\);/g, 'console.error("Error:", err.message || err);');
                modified = true;
            }

            // Fix specific verbose logs like console.error("...", err.message, err);
            if (content.match(/console\.error\([^,]+, err\.message, err\);/g)) {
                content = content.replace(/console\.error\(([^,]+), err\.message, err\);/g, 'console.error($1, err.message);');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Sanitized ${file}`);
            }
        }
    }
}

sanitizeLogs(controllersDir);
console.log('Sanitization complete.');
