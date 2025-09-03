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
 * Sync files from source to wiki, preserving directory structure and removing orphaned files
 */
async function syncFiles(sourceDir: string, wikiDir: string): Promise<void> {
  console.log('Analyzing files to sync...');
  
  // Get all valid source files
  const sourceFiles = await findFiles(sourceDir, FILE_EXTENSIONS);
  const sourceRelativePaths = new Set<string>();
  
  // Copy all source files and track their paths
  console.log(`Found ${sourceFiles.length} files to sync`);
  let copiedCount = 0;
  let skippedCount = 0;
  
  for (const file of sourceFiles) {
    const relativePath = path.relative(sourceDir, file);
    sourceRelativePaths.add(relativePath);
    
    const targetPath = path.join(wikiDir, relativePath);
    const targetDir = path.dirname(targetPath);
    
    // Create directory structure
    await fs.mkdir(targetDir, { recursive: true });
    
    // Check if file needs updating (compare modification times)
    let needsCopy = true;
    try {
      const sourceStat = await fs.stat(file);
      const targetStat = await fs.stat(targetPath);
      // Only copy if source is newer or sizes differ
      needsCopy = sourceStat.mtime > targetStat.mtime || sourceStat.size !== targetStat.size;
    } catch {
      // Target doesn't exist, needs copy
      needsCopy = true;
    }
    
    if (needsCopy) {
      await fs.copyFile(file, targetPath);
      console.log(`  Updated: ${relativePath}`);
      copiedCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`Updated ${copiedCount} files, ${skippedCount} unchanged`);
  
  // Find and remove files that don't exist in source
  console.log('Checking for orphaned files in wiki...');
  const wikiFiles = await getAllFiles(wikiDir);
  let removedCount = 0;
  
  for (const wikiFile of wikiFiles) {
    // Check if this file should exist (either as-is or will be renamed)
    let shouldExist = sourceRelativePaths.has(wikiFile);
    
    // Special handling for Home files that will be created from READMEs
    if (wikiFile.startsWith('Home')) {
      const readmeVariant1 = wikiFile.replace(/^Home(-.*)?\.md$/, 'README$1.md');
      const readmeVariant2 = wikiFile.replace(/^Home-(.+)\.md$/, 'README.$1.md');
      shouldExist = sourceRelativePaths.has(readmeVariant1) || sourceRelativePaths.has(readmeVariant2) || sourceRelativePaths.has('README.md');
    }
    
    if (!shouldExist) {
      const fullPath = path.join(wikiDir, wikiFile);
      await fs.unlink(fullPath);
      console.log(`  Removed: ${wikiFile}`);
      removedCount++;
    }
  }
  
  if (removedCount > 0) {
    console.log(`Removed ${removedCount} orphaned files`);
    
    // Clean up empty directories
    await cleanEmptyDirectories(wikiDir);
  }
}

/**
 * Remove empty directories recursively
 */
async function cleanEmptyDirectories(dir: string): Promise<void> {
  async function removeEmptyDirs(currentDir: string): Promise<boolean> {
    if (currentDir === dir) return false; // Don't remove root
    
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      // Skip .git directory
      const filteredEntries = entries.filter(e => e.name !== '.git');
      
      if (filteredEntries.length === 0) {
        await fs.rmdir(currentDir);
        return true;
      }
      
      // Check subdirectories
      for (const entry of filteredEntries) {
        if (entry.isDirectory()) {
          const subDir = path.join(currentDir, entry.name);
          await removeEmptyDirs(subDir);
        }
      }
      
      // Check again after cleaning subdirectories
      const remainingEntries = await fs.readdir(currentDir);
      const filteredRemaining = remainingEntries.filter(e => e !== '.git');
      
      if (filteredRemaining.length === 0 && currentDir !== dir) {
        await fs.rmdir(currentDir);
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
  
  // Get all directories and process them
  const allDirs = await getAllDirectories(dir);
  for (const subDir of allDirs) {
    await removeEmptyDirs(subDir);
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
        // Language-specific README (e.g., README-ZH_CN.md or README.es.md)
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
    // Root README doesn't exist or can't be accessed
    console.log('  No root README.md found to use as Home page');
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
  
  console.log('Starting documentation sync to wiki...');
  console.log(`Source: ${config.docsPath}`);
  console.log(`Target: ${config.wikiPath}`);
  
  try {
    // Verify paths exist
    await fs.access(config.docsPath);
    await fs.access(config.wikiPath);
    
    // Sync files (copy new/updated, remove orphaned)
    await syncFiles(config.docsPath, config.wikiPath);
    
    // Copy root README.md as Home.md
    await copyRootReadme(config.mainRepoPath, config.wikiPath);
    
    // Rename README files to wiki-compatible names
    await renameReadmeFiles(config.wikiPath);
    
    // Check for changes
    const changed = await hasChanges(config.wikiPath);
    
    if (changed) {
      console.log('\nChanges detected in wiki');
      // GitHub Actions output format
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