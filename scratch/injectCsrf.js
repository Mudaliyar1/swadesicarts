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

            let searchIndex = 0;
            let replacements = [];
            
            while (true) {
                const formStart = content.indexOf('<form', searchIndex);
                if (formStart === -1) break;
                
                // Find the actual end of the form tag, skipping over %> inside
                let formEnd = formStart;
                let inEjs = false;
                for (let i = formStart; i < content.length; i++) {
                    if (content.substr(i, 2) === '<%') {
                        inEjs = true;
                        i++; // skip %
                        continue;
                    }
                    if (content.substr(i, 2) === '%>') {
                        inEjs = false;
                        i++; // skip >
                        continue;
                    }
                    
                    if (content[i] === '>' && !inEjs) {
                        formEnd = i;
                        break;
                    }
                }
                
                if (formEnd === formStart) { // fallback
                    formEnd = content.indexOf('>', formStart);
                }
                
                const formTag = content.substring(formStart, formEnd + 1);
                searchIndex = formEnd + 1;
                
                console.log(`Checking form in ${fullPath}: ${formTag}`);
                
                // Only process POST forms
                if (!formTag.toLowerCase().includes('method="post"') && !formTag.toLowerCase().includes("method='post'")) {
                    console.log(`-> Not a POST form, skipped.`);
                    continue;
                }
                
                // Check if the next 500 characters contain the csrf token
                // or just check if it's already there right after
                const afterForm = content.substring(searchIndex, searchIndex + 500);
                if (!afterForm.includes('name="_csrf"')) {
                    console.log(`-> Injecting CSRF into this form.`);
                    replacements.push({
                        index: searchIndex,
                        text: '\n    <input type="hidden" name="_csrf" value="<%= csrfToken %>">'
                    });
                } else {
                    console.log(`-> Skipped, already has CSRF nearby.`);
                }
            }
            
            if (replacements.length > 0) {
                // Apply replacements from back to front to avoid shifting indices
                replacements.reverse().forEach(rep => {
                    content = content.substring(0, rep.index) + rep.text + content.substring(rep.index);
                });
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Injected CSRF into ${fullPath} (${replacements.length} forms)`);
                modified = true;
            }
            
            // Also check for fetch POST without csrf
            // Simple check: fetch( ... method: 'POST' ... without x-csrf-token
            // This is harder to regex reliably, we can manually check ticket-detail-desktop.ejs
        }
    }
}

processDir(path.join(__dirname, '..', 'views'));
