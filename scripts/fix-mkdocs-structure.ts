#!/usr/bin/env node
/**
 * Fix MkDocs structure by moving overview pages to index.md inside their directories.
 * This prevents duplicate navigation entries when a file and directory have the same name.
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
        // Skip external links
        if (link.startsWith('http')) {
            return match;
        }
        
        // Decode URL-encoded paths for processing
        // Use decodeURIComponent which is equivalent to Python's unquote
        let decodedLink: string;
        try {
            decodedLink = decodeURIComponent(link);
        } catch (err) {
            // If decoding fails, use the original link
            decodedLink = link;
        }
        
        // Special case: if we're in index.md and the link starts with the parent directory name
        if (isIndex && decodedLink.includes('/')) {
            const pathParts = decodedLink.split('/');
            const parentDirName = path.basename(currentDir);
            
            // Check if first part matches the parent directory name
            if (pathParts[0] === parentDirName) {
                // This is a self-referential path, strip the first part
                const fixedLink = pathParts.slice(1).join('/');
                // Continue processing with the fixed link
                const decodedFixedLink = fixedLink;
                
                // Check if this fixed link points to a directory with index.md
                if (!decodedFixedLink.startsWith('/')) {
                    const resolvedPath = path.resolve(currentDir, decodedFixedLink);
                    
                    if (resolvedPath.endsWith('.md')) {
                        const potentialDir = resolvedPath.slice(0, -3);
                        const potentialIndex = path.join(potentialDir, 'index.md');
                        
                        if (fs.existsSync(potentialIndex)) {
                            // Check if they share the same parent directory
                            if (path.dirname(potentialDir) === path.dirname(currentDir)) {
                                // It's a sibling - just use directory name
                                const dirName = path.basename(potentialDir).replace(/ /g, '%20');
                                return `[${text}](${dirName}/)`;
                            }
                            
                            // Calculate relative path from current file to the directory
                            const newPath = path.relative(currentDir, potentialDir).replace(/\\/g, '/').replace(/ /g, '%20');
                            return `[${text}](${newPath}/)`;
                        }
                    }
                }
                
                // If no special handling needed for the fixed link, return it as-is
                const fixedLinkEncoded = fixedLink.replace(/ /g, '%20');
                return `[${text}](${fixedLinkEncoded})`;
            }
        }
        
        // For any .md link, check if there's a directory with index.md
        if (!decodedLink.startsWith('/')) {
            const resolvedPath = path.resolve(currentDir, decodedLink);
            
            // Check if this points to a file that should be a directory
            if (resolvedPath.endsWith('.md')) {
                const potentialDir = resolvedPath.slice(0, -3);
                const potentialIndex = path.join(potentialDir, 'index.md');
                
                // If a directory with index.md exists, update the link
                if (fs.existsSync(potentialIndex)) {
                    if (isIndex) {
                        // Check if they share the same parent directory
                        if (path.dirname(potentialDir) === path.dirname(currentDir)) {
                            // It's a sibling - just use directory name
                            const dirName = path.basename(potentialDir).replace(/ /g, '%20');
                            return `[${text}](${dirName}/)`;
                        }
                    }
                    
                    // Calculate relative path from current file to the directory
                    const newPath = path.relative(currentDir, potentialDir).replace(/\\/g, '/').replace(/ /g, '%20');
                    return `[${text}](${newPath}/)`;
                }
            }
        }
        
        // Also handle local references (same directory) - should be 'if', not 'elif'
        // This is intentional to handle both absolute and relative paths
        if (!decodedLink.includes('/')) {
            const basename = decodedLink.slice(0, -3); // Remove .md
            const possibleDir = path.join(currentDir, basename);
            
            if (fs.existsSync(possibleDir) && fs.statSync(possibleDir).isDirectory()) {
                const encodedBasename = basename.replace(/ /g, '%20');
                return `[${text}](${encodedBasename}/)`;
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

function main(): number {
    // Get the docs directory
    const scriptDir = path.dirname(new URL(import.meta.url).pathname);
    const projectRoot = path.dirname(scriptDir);
    const docsDir = path.join(projectRoot, 'docs');
    
    // Handle Windows paths (remove leading slash if on Windows)
    const normalizedDocsDir = process.platform === 'win32' && docsDir.startsWith('/') 
        ? docsDir.substring(1) 
        : docsDir;
    
    if (!fs.existsSync(normalizedDocsDir)) {
        console.error(`Error: docs directory not found at ${normalizedDocsDir}`);
        return 1;
    }
    
    console.log(`Fixing MkDocs structure in ${normalizedDocsDir}`);
    console.log('-'.repeat(50));
    
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
    console.log(`Structure fix complete: ${fixes.length} files moved, ${updates.length} files updated`);
    
    return 0;
}

// Run the main function
process.exit(main());