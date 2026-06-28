const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Simple regex to find fetch calls with method: POST|PUT|DELETE
            // that don't have x-csrf-token already
            const fetchRegex = /fetch\([^,]+,\s*\{[\s\S]*?method:\s*['"](?:POST|PUT|DELETE)['"][\s\S]*?\}/gi;
            
            let match;
            let replacements = [];
            
            while ((match = fetchRegex.exec(content)) !== null) {
                const fetchBlock = match[0];
                const blockIndex = match.index;
                
                if (!fetchBlock.toLowerCase().includes('x-csrf-token')) {
                    // Check if there is a headers object
                    const headersMatch = fetchBlock.match(/headers:\s*\{([^}]*)\}/i);
                    let newFetchBlock = fetchBlock;
                    if (headersMatch) {
                        const originalHeadersStr = headersMatch[1];
                        const newHeadersStr = originalHeadersStr.trim() ? `${originalHeadersStr}, 'x-csrf-token': '<%= csrfToken %>'` : `'x-csrf-token': '<%= csrfToken %>'`;
                        newFetchBlock = newFetchBlock.replace(headersMatch[0], `headers: { ${newHeadersStr} }`);
                    } else {
                        // Insert headers before method or anywhere inside the config object
                        newFetchBlock = newFetchBlock.replace(/\{/, "{ headers: { 'x-csrf-token': '<%= csrfToken %>' },");
                    }
                    
                    console.log(`Injecting CSRF into fetch in ${fullPath}`);
                    replacements.push({
                        index: blockIndex,
                        originalLength: fetchBlock.length,
                        text: newFetchBlock
                    });
                }
            }
            
            if (replacements.length > 0) {
                replacements.reverse().forEach(rep => {
                    content = content.substring(0, rep.index) + rep.text + content.substring(rep.index + rep.originalLength);
                });
                fs.writeFileSync(fullPath, content, 'utf8');
                modified = true;
            }
        }
    }
}

processDir(path.join(__dirname, '..', 'views'));
