#!/usr/bin/env tsx

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Dirent } from 'fs';

const execAsync = promisify(exec);

// Configuration
const FILE_EXTENSIONS = ['.md', '.png', '.jpg', '.jpeg', '.gif', '.svg'] as const;
const README_PATTERN = /^README(?:[-.](.+))?\.md$/;

interface SyncConfig {
  mainRepoPath: string;
  wikiPath: string;
  docsPath: string;
}

/**
 * Convert markdown to GitHub Wiki format
 * - Images: ![](image.png) → [[image.png]]
 * - Links: [text](page.md) → [[text|page]]
 */
async function convertToWikiFormat(wikiDir: string): Promise<void> {
  console.log('Converting to GitHub Wiki format...');
  const mdFiles = await findFiles(wikiDir, ['.md']);
  let convertedCount = 0;
  
  for (const file of mdFiles) {
    let content = await fs.readFile(file, 'utf-8');
    const originalContent = content;
    
    // Convert image references to wiki format
    // ![alt](image.png) → [[image.png]]
    content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      // Skip external URLs
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return match;
      }
      
      // Decode URL encoding
      let imagePath = src;
      if (src.includes('%')) {
        try {
          imagePath = decodeURIComponent(src);
        } catch {
          imagePath = src;
        }
      }
      
      // Extract just the filename for wiki syntax
      const filename = path.basename(imagePath);
      
      // Use wiki syntax for images
      // If alt text exists, add it after pipe
      if (alt && alt.trim()) {
        return `[[${filename}|alt=${alt}]]`;
      } else {
        return `[[${filename}]]`;
      }
    });
    
    // Convert internal markdown links to wiki format
    // [text](../path/to/Page.md) → [[text|Page]]
    content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
      // Skip external URLs, anchors, and images
      if (href.startsWith('http://') || 
          href.startsWith('https://') || 
          href.startsWith('#') ||
          href.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
        return match;
      }
      
      // Check if it's a markdown file link
      if (href.endsWith('.md') || href.includes('.md#')) {
        // Decode URL encoding
        let decodedHref = href;
        if (href.includes('%')) {
          try {
            decodedHref = decodeURIComponent(href);
          } catch {
            decodedHref = href;
          }
        }
        
        // Extract page name without extension and path
        let pageName = decodedHref
          .replace(/\.md(#.*)?$/, '') // Remove .md and anchor
          .split('/')                 // Split by path
          .pop() || '';               // Get last part (filename)
        
        // Convert spaces to hyphens (GitHub wiki convention)
        pageName = pageName.replace(/ /g, '-');
        
        // Use wiki link syntax
        if (text === pageName || text === pageName.replace(/-/g, ' ')) {
          return `[[${pageName}]]`;
        } else {
          return `[[${text}|${pageName}]]`;
        }
      }
      
      // For other internal links, just decode URL encoding
      if (href.includes('%') && !href.startsWith('http')) {
        try {
          const decodedHref = decodeURIComponent(href);
          return `[${text}](${decodedHref})`;
        } catch {
          return match;
        }
      }
      
      return match;
    });
    
    // Save if modified
    if (content !== originalContent) {
      await fs.writeFile(file, content, 'utf-8');
      const relativePath = path.relative(wikiDir, file);
      console.log(`  Converted: ${relativePath}`);
      convertedCount++;
    }
  }
  
  if (convertedCount > 0) {
    console.log(`Converted ${convertedCount} files to wiki format`);
  } else {
    console.log('No files needed conversion');
  }
}

/**
 * Recursively find all files matching the given extensions
 */
async function findFiles(dir: string, extensions: readonly string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    const entries: Dirent[] = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Get all files in a directory recursively
 */
async function getAllFiles(dir: string): Promise<Set<string>> {
  const files = new Set<string>();
  
  async function walk(currentDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(dir, fullPath);
        
        // Skip .git directory
        if (entry.name === '.git' || relativePath.startsWith('.git')) continue;
        
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile()) {
          files.add(relativePath);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Flatten directory structure - move all files to root
 * GitHub Wiki prefers flat structure
 */
async function flattenStructure(wikiDir: string): Promise<void> {
  console.log('Flattening directory structure for wiki...');
  const allFiles = await getAllFiles(wikiDir);
  let movedCount = 0;
  
  for (const file of allFiles) {
    // Skip if already at root
    if (!file.includes('/')) continue;
    
    const oldPath = path.join(wikiDir, file);
    const basename = path.basename(file);
    
    // Create unique name if file already exists at root
    let newName = basename;
    let counter = 1;
    while (await fileExists(path.join(wikiDir, newName))) {
      const ext = path.extname(basename);
      const nameWithoutExt = basename.slice(0, -ext.length);
      newName = `${nameWithoutExt}-${counter}${ext}`;
      counter++;
    }
    
    const newPath = path.join(wikiDir, newName);
    
    // Move file to root
    await fs.rename(oldPath, newPath);
    console.log(`  Moved: ${file} → ${newName}`);
    movedCount++;
  }
  
  if (movedCount > 0) {
    console.log(`Moved ${movedCount} files to root`);
    
    // Clean up empty directories
    await cleanEmptyDirectories(wikiDir);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove empty directories recursively
 */
async function cleanEmptyDirectories(dir: string): Promise<void> {
  const allDirs = await getAllDirectories(dir);
  
  for (const subDir of allDirs) {
    try {
      const entries = await fs.readdir(subDir);
      if (entries.length === 0 || (entries.length === 1 && entries[0] === '.git')) {
        await fs.rmdir(subDir);
      }
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Get all directories recursively
 */
async function getAllDirectories(dir: string): Promise<string[]> {
  const dirs: string[] = [];
  
  async function walk(currentDir: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== '.git') {
          const fullPath = path.join(currentDir, entry.name);
          dirs.push(fullPath);
          await walk(fullPath);
        }
      }
    } catch {
      // Ignore errors
    }
  }
  
  await walk(dir);
  return dirs.sort((a, b) => b.length - a.length); // Sort longest first for cleanup
}

/**
 * Sync files from source to wiki
 */
async function syncFiles(sourceDir: string, wikiDir: string): Promise<void> {
  console.log('Syncing files to wiki...');
  
  // Get all valid source files
  const sourceFiles = await findFiles(sourceDir, FILE_EXTENSIONS);
  const sourceRelativePaths = new Set<string>();
  
  // Copy all source files
  console.log(`Found ${sourceFiles.length} files to sync`);
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(sourceDir, file);
    sourceRelativePaths.add(relativePath);
    
    const targetPath = path.join(wikiDir, relativePath);
    const targetDir = path.dirname(targetPath);
    
    // Create directory structure
    await fs.mkdir(targetDir, { recursive: true });
    
    // Copy file
    await fs.copyFile(file, targetPath);
  }
  
  // Remove orphaned files
  const wikiFiles = await getAllFiles(wikiDir);
  for (const wikiFile of wikiFiles) {
    if (!sourceRelativePaths.has(wikiFile) && !wikiFile.startsWith('Home')) {
      const fullPath = path.join(wikiDir, wikiFile);
      await fs.unlink(fullPath);
    }
  }
}

/**
 * Copy root README.md to wiki as Home.md if it exists
 */
async function copyRootReadme(mainRepoPath: string, wikiPath: string): Promise<void> {
  const rootReadmePath = path.join(mainRepoPath, 'README.md');
  const wikiHomePath = path.join(wikiPath, 'Home.md');
  
  try {
    await fs.access(rootReadmePath);
    await fs.copyFile(rootReadmePath, wikiHomePath);
    console.log('  Copied root README.md as Home.md');
  } catch (error) {
    console.log('  No root README.md found to use as Home page');
  }
}

/**
 * Rename README files to wiki-compatible names
 */
async function renameReadmeFiles(wikiDir: string): Promise<void> {
  console.log('Converting README files for wiki compatibility...');
  const files = await fs.readdir(wikiDir);
  
  for (const file of files) {
    const match = file.match(README_PATTERN);
    if (match) {
      const oldPath = path.join(wikiDir, file);
      let newName: string;
      
      if (match[1]) {
        // Language-specific README
        newName = `Home-${match[1]}.md`;
      } else {
        // Main README
        newName = 'Home.md';
      }
      
      const newPath = path.join(wikiDir, newName);
      await fs.rename(oldPath, newPath);
      console.log(`  Renamed: ${file} → ${newName}`);
    }
  }
}

/**
 * Check if there are any changes in the wiki
 */
async function hasChanges(wikiDir: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd: wikiDir });
    return stdout.trim().length > 0;
  } catch (error) {
    console.error('Error checking git status:', error);
    return false;
  }
}

/**
 * Get configuration from environment variables
 */
function getConfig(): SyncConfig {
  const mainRepoPath = process.env.MAIN_REPO_PATH || 'main-repo';
  const wikiPath = process.env.WIKI_PATH || 'wiki';
  const docsPath = path.join(mainRepoPath, 'docs');
  
  return { mainRepoPath, wikiPath, docsPath };
}

/**
 * Main sync function
 */
async function syncDocsToWiki(): Promise<void> {
  const config = getConfig();
  const flattenWiki = process.env.FLATTEN_WIKI === 'true';
  
  console.log('Starting documentation sync to wiki...');
  console.log(`Source: ${config.docsPath}`);
  console.log(`Target: ${config.wikiPath}`);
  console.log(`Flatten structure: ${flattenWiki}`);
  
  try {
    // Verify paths exist
    await fs.access(config.docsPath);
    await fs.access(config.wikiPath);
    
    // Sync files
    await syncFiles(config.docsPath, config.wikiPath);
    
    // Copy root README.md as Home.md
    await copyRootReadme(config.mainRepoPath, config.wikiPath);
    
    // Convert to wiki format
    await convertToWikiFormat(config.wikiPath);
    
    // Optionally flatten directory structure
    if (flattenWiki) {
      await flattenStructure(config.wikiPath);
    }
    
    // Rename README files to wiki-compatible names
    await renameReadmeFiles(config.wikiPath);
    
    // Check for changes
    const changed = await hasChanges(config.wikiPath);
    
    if (changed) {
      console.log('\nChanges detected in wiki');
      process.stdout.write('::set-output name=changes::true\n');
    } else {
      console.log('\nNo changes detected in wiki');
      process.stdout.write('::set-output name=changes::false\n');
    }
    
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Error during sync:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncDocsToWiki();
}

export { syncDocsToWiki };