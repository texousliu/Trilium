#!/usr/bin/env node
/**
 * Fix MkDocs structure by:
 * 1. Syncing README.md to docs/index.md with necessary path adjustments
 * 2. Moving overview pages to index.md inside their directories to prevent duplicate navigation entries
 */

import * as fs from 'fs';
import * as path from 'path';

interface FixResult {
    message: string;
}

/**
 * Find markdown files that have a corresponding directory with the same name,
 * and move them to index.md inside that directory.
 */
function fixDuplicateEntries(docsDir: string): FixResult[] {
    const fixesMade: FixResult[] = [];
    
    function walkDir(dir: string): void {
        let files: string[];
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
            console.warn(`Warning: Unable to read directory ${dir}: ${err.message}`);
            return;
        }
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            let stat: fs.Stats;
            
            try {
                stat = fs.statSync(filePath);
            } catch (err) {
                // File might have been moved already, skip it
                continue;
            }
            
            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith('.md')) {
                const basename = file.slice(0, -3); // Remove .md extension
                const dirPath = path.join(dir, basename);
                
                // Check if there's a directory with the same name
                if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
                    const indexPath = path.join(dirPath, 'index.md');
                    
                    // Check if index.md already exists in that directory
                    if (!fs.existsSync(indexPath)) {
                        // Move the file to index.md in the directory
                        fs.renameSync(filePath, indexPath);
                        fixesMade.push({
                            message: `Moved ${path.relative(docsDir, filePath)} -> ${path.relative(docsDir, indexPath)}`
                        });
                        
                        // Move associated images with pattern basename_*
                        try {
                            const dirFiles = fs.readdirSync(dir);
                            for (const imgFile of dirFiles) {
                                if (imgFile.startsWith(`${basename}_`)) {
                                    const imgSrc = path.join(dir, imgFile);
                                    try {
                                        if (!fs.statSync(imgSrc).isDirectory()) {
                                            const imgDest = path.join(dirPath, imgFile);
                                            fs.renameSync(imgSrc, imgDest);
                                            fixesMade.push({
                                                message: `Moved ${path.relative(docsDir, imgSrc)} -> ${path.relative(docsDir, imgDest)}`
                                            });
                                        }
                                    } catch (err) {
                                        // File might have been moved already, skip it
                                    }
                                }
                            }
                        } catch (err) {
                            // Directory might not exist anymore, skip it
                        }
                        
                        // Move exact match images
                        const imgExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
                        for (const ext of imgExtensions) {
                            const imgFile = path.join(dir, `${basename}${ext}`);
                            if (fs.existsSync(imgFile)) {
                                const imgDest = path.join(dirPath, `${basename}${ext}`);
                                fs.renameSync(imgFile, imgDest);
                                fixesMade.push({
                                    message: `Moved ${path.relative(docsDir, imgFile)} -> ${path.relative(docsDir, imgDest)}`
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    
    walkDir(docsDir);
    return fixesMade;
}

/**
 * Update references in markdown files to point to the new locations.
 */
function updateReferences(docsDir: string): FixResult[] {
    const updatesMade: FixResult[] = [];
    
    function fixLink(match: string, text: string, link: string, currentDir: string, isIndex: boolean): string {
        // Skip external links, mailto, and special protocols
        if (link.startsWith('http') || link.startsWith('mailto:') || link.startsWith('xmpp:')) {
            return match;
        }
        
        // Skip anchor-only links
        if (link.startsWith('#')) {
            return match;
        }
        
        // Handle malformed links with nested brackets (e.g., [developers]([url](https://...))
        if (link.includes('[') || link.includes(']')) {
            // This is a malformed link, skip it
            return match;
        }
        
        // Handle links wrapped in angle brackets (e.g., <https://...>)
        if (link.startsWith('<') && link.endsWith('>')) {
            // This is likely a literal URL that shouldn't be processed
            return match;
        }
        
        // Decode URL-encoded paths for processing
        let decodedLink: string;
        try {
            decodedLink = decodeURIComponent(link);
        } catch (err) {
            // If decoding fails, use the original link
            decodedLink = link;
        }
        
        // Extract anchor if present
        let anchorPart = '';
        if (decodedLink.includes('#')) {
            const parts = decodedLink.split('#');
            decodedLink = parts[0];
            anchorPart = '#' + parts.slice(1).join('#');
        }
        
        // Special case: if we're in index.md and the link starts with the parent directory name
        // This happens when a file was converted to index.md and had links to siblings
        if (isIndex && decodedLink.includes('/')) {
            const pathParts = decodedLink.split('/');
            const parentDirName = path.basename(currentDir);
            
            // Check if first part matches the parent directory name
            if (pathParts[0] === parentDirName) {
                // This is a self-referential path, strip the first part
                const fixedLink = pathParts.slice(1).join('/');
                // Re-encode spaces for URL compatibility before recursing
                const fixedLinkEncoded = fixedLink.replace(/ /g, '%20');
                // Recursively process the fixed link
                return fixLink(`[${text}](${fixedLinkEncoded}${anchorPart})`, text, fixedLinkEncoded + anchorPart, currentDir, isIndex);
            }
        }
        
        // For any .md link, check if there's a directory with index.md
        // that should be used instead
        if (!decodedLink.startsWith('/')) {
            // Resolve relative to current directory
            const resolvedPath = path.resolve(currentDir, decodedLink);
            
            // Check if this points to a file that should be a directory
            // Remove .md extension to get the potential directory name
            if (resolvedPath.endsWith('.md')) {
                const potentialDir = resolvedPath.slice(0, -3);
                const potentialIndex = path.join(potentialDir, 'index.md');
                
                // If a directory with index.md exists, update the link
                if (fs.existsSync(potentialIndex)) {
                    // If we're in an index.md file and linking to a file that's now
                    // in a sibling directory, adjust the path
                    if (isIndex) {
                        // Check if they share the same parent directory
                        if (path.dirname(potentialDir) === path.dirname(currentDir)) {
                            // It's a sibling - just use directory name
                            const dirName = path.basename(potentialDir).replace(/ /g, '%20');
                            return `[${text}](${dirName}/${anchorPart})`;
                        }
                    }
                    
                    // Calculate relative path from current file to the directory
                    const newPath = path.relative(currentDir, potentialDir).replace(/\\/g, '/').replace(/ /g, '%20');
                    return `[${text}](${newPath}/${anchorPart})`;
                }
                
                // Check if the target file exists
                if (!fs.existsSync(resolvedPath)) {
                    // Try to find a similar file by removing special characters from the filename
                    const dirPath = path.dirname(resolvedPath);
                    const fileName = path.basename(resolvedPath);
                    
                    // Remove problematic characters and try to find the file
                    const cleanFileName = fileName.replace(/[\(\)\\]/g, '');
                    const cleanPath = path.join(dirPath, cleanFileName);
                    
                    if (fs.existsSync(cleanPath)) {
                        // Calculate relative path from current file to the cleaned file
                        const newPath = path.relative(currentDir, cleanPath).replace(/\\/g, '/').replace(/ /g, '%20');
                        return `[${text}](${newPath}${anchorPart})`;
                    }
                }
            }
        }
        
        // Also handle local references (same directory)
        if (!decodedLink.includes('/')) {
            const basename = decodedLink.endsWith('.md') ? decodedLink.slice(0, -3) : decodedLink;
            const possibleDir = path.join(currentDir, basename);
            
            if (fs.existsSync(possibleDir) && fs.statSync(possibleDir).isDirectory()) {
                // Re-encode spaces for URL compatibility
                const encodedBasename = basename.replace(/ /g, '%20');
                return `[${text}](${encodedBasename}/${anchorPart})`;
            }
        }
        
        return match;
    }
    
    function walkDir(dir: string): void {
        let files: string[];
        try {
            files = fs.readdirSync(dir);
        } catch (err) {
            console.warn(`Warning: Unable to read directory ${dir}: ${err.message}`);
            return;
        }
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            let stat: fs.Stats;
            
            try {
                stat = fs.statSync(filePath);
            } catch (err) {
                // File might have been moved already, skip it
                continue;
            }
            
            if (stat.isDirectory()) {
                walkDir(filePath);
            } else if (file.endsWith('.md')) {
                let content = fs.readFileSync(filePath, 'utf-8');
                const originalContent = content;
                
                const isIndex = file === 'index.md';
                const currentDir = path.dirname(filePath);
                
                // Update markdown links: [text](path.md)
                const pattern = /\[([^\]]*)\]\(([^)]+\.md)\)/g;
                content = content.replace(pattern, (match, text, link) => {
                    return fixLink(match, text, link, currentDir, isIndex);
                });
                
                if (content !== originalContent) {
                    fs.writeFileSync(filePath, content, 'utf-8');
                    updatesMade.push({
                        message: `Updated references in ${path.relative(docsDir, filePath)}`
                    });
                }
            }
        }
    }
    
    walkDir(docsDir);
    return updatesMade;
}

/**
 * Sync README.md to docs/index.md with necessary path adjustments
 */
function syncReadmeToIndex(projectRoot: string, docsDir: string): FixResult[] {
    const results: FixResult[] = [];
    const readmePath = path.join(projectRoot, 'README.md');
    const indexPath = path.join(docsDir, 'index.md');
    
    if (!fs.existsSync(readmePath)) {
        console.warn('README.md not found in project root');
        return results;
    }
    
    // Read README content
    let content = fs.readFileSync(readmePath, 'utf-8');
    
    // Fix image path (./docs/app.png -> app.png)
    content = content.replace(/src="\.\/docs\/app\.png"/g, 'src="app.png"');
    
    // Fix language links in header
    content = content.replace(/\[English\]\(\.\/README\.md\)/g, '[English](./index.md)');
    content = content.replace(/\.\/docs\/README-ZH_CN\.md/g, './README-ZH_CN.md');
    content = content.replace(/\.\/docs\/README-ZH_TW\.md/g, './README-ZH_TW.md');
    content = content.replace(/\.\/docs\/README\.ru\.md/g, './README.ru.md');
    content = content.replace(/\.\/docs\/README\.ja\.md/g, './README.ja.md');
    content = content.replace(/\.\/docs\/README\.it\.md/g, './README.it.md');
    content = content.replace(/\.\/docs\/README\.es\.md/g, './README.es.md');
    
    // Fix internal documentation links (./docs/User%20Guide -> ./User%20Guide)
    content = content.replace(/\.\/docs\/User%20Guide/g, './User%20Guide');
    content = content.replace(/\.\/docs\/Script%20API/g, './Script%20API');
    content = content.replace(/\.\/docs\/Developer%20Guide/g, './Developer%20Guide');
    
    // Fix specific broken links found in index.md
    // These links point to non-existent files, so we need to fix them
    content = content.replace(/User%20Guide\/quick-start\.md/g, 'User%20Guide/User%20Guide/');
    content = content.replace(/User%20Guide\/installation\.md/g, 'User%20Guide/User%20Guide/Installation%20&%20Setup/');
    content = content.replace(/User%20Guide\/docker\.md/g, 'User%20Guide/User%20Guide/Installation%20&%20Setup/Docker%20installation/');
    content = content.replace(/User%20Guide\/index\.md/g, 'User%20Guide/User%20Guide/');
    content = content.replace(/Script%20API\/index\.md/g, 'Script%20API/');
    content = content.replace(/Developer%20Guide\/index\.md/g, 'Developer%20Guide/Developer%20Guide/');
    content = content.replace(/Developer%20Guide\/contributing\.md/g, 'Developer%20Guide/Developer%20Guide/');
    content = content.replace(/support\/faq\.md/g, 'User%20Guide/User%20Guide/FAQ/');
    content = content.replace(/support\/troubleshooting\.md/g, 'User%20Guide/User%20Guide/');
    
    // Write the adjusted content to docs/index.md
    fs.writeFileSync(indexPath, content, 'utf-8');
    results.push({
        message: `Synced README.md to docs/index.md with path adjustments`
    });
    
    return results;
}

function main(): number {
    // Get the docs directory
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const projectRoot = path.dirname(scriptDir);
    const docsDir = path.join(projectRoot, 'docs');
    
    // Handle Windows paths (remove leading slash if on Windows)
    const normalizedProjectRoot = process.platform === 'win32' && projectRoot.startsWith('/') 
        ? projectRoot.substring(1) 
        : projectRoot;
    const normalizedDocsDir = process.platform === 'win32' && docsDir.startsWith('/') 
        ? docsDir.substring(1) 
        : docsDir;
    
    if (!fs.existsSync(normalizedDocsDir)) {
        console.error(`Error: docs directory not found at ${normalizedDocsDir}`);
        return 1;
    }
    
    console.log(`Fixing MkDocs structure in ${normalizedDocsDir}`);
    console.log('-'.repeat(50));
    
    // Sync README.md to docs/index.md
    const syncResults = syncReadmeToIndex(normalizedProjectRoot, normalizedDocsDir);
    if (syncResults.length > 0) {
        console.log('README sync:');
        for (const result of syncResults) {
            console.log(`  - ${result.message}`);
        }
        console.log();
    }
    
    // Fix duplicate entries
    const fixes = fixDuplicateEntries(normalizedDocsDir);
    if (fixes.length > 0) {
        console.log('Files reorganized:');
        for (const fix of fixes) {
            console.log(`  - ${fix.message}`);
        }
    } else {
        console.log('No duplicate entries found that need fixing');
    }
    
    console.log();
    
    // Update references
    const updates = updateReferences(normalizedDocsDir);
    if (updates.length > 0) {
        console.log('References updated:');
        for (const update of updates) {
            console.log(`  - ${update.message}`);
        }
    } else {
        console.log('No references needed updating');
    }
    
    console.log('-'.repeat(50));
    console.log(`Structure fix complete: ${syncResults.length} README syncs, ${fixes.length} files moved, ${updates.length} files updated`);
    
    return 0;
}

// Run the main function
process.exit(main());