#!/usr/bin/env tsx

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, resolve, extname } from 'path';
import { pathToFileURL } from 'url';

interface LinkValidationResult {
  file: string;
  line: number;
  link: string;
  type: 'relative' | 'anchor' | 'absolute' | 'external';
  valid: boolean;
  reason?: string;
  targetFile?: string;
}

class DocumentationLinkValidator {
  private siteDir: string;
  private sourceDir: string;
  private results: LinkValidationResult[] = [];
  private fileCache: Map<string, string> = new Map();

  constructor(siteDir: string = './site', sourceDir: string = './docs') {
    this.siteDir = resolve(siteDir);
    this.sourceDir = resolve(sourceDir);
  }

  /**
   * Get all HTML files in the site directory
   */
  private getAllHtmlFiles(dir: string): string[] {
    const files: string[] = [];
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllHtmlFiles(fullPath));
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Get all markdown files in the docs directory
   */
  private getAllMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    const items = readdirSync(dir);

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...this.getAllMarkdownFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Extract links from HTML content
   */
  private extractHtmlLinks(content: string, filePath: string): Array<{link: string, line: number}> {
    const links: Array<{link: string, line: number}> = [];
    const lines = content.split('\n');
    
    // Regex patterns for different types of links
    const patterns = [
      /href=["']([^"']+)["']/g,  // href attributes
      /src=["']([^"']+)["']/g,   // src attributes (for images, scripts, etc.)
    ];

    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const link = match[1];
          // Skip external links, mailto, javascript, and data URLs
          if (!link.startsWith('http://') && 
              !link.startsWith('https://') && 
              !link.startsWith('mailto:') &&
              !link.startsWith('javascript:') &&
              !link.startsWith('data:') &&
              !link.startsWith('//')) {
            links.push({ link, line: index + 1 });
          }
        }
      });
    });

    return links;
  }

  /**
   * Extract links from Markdown content
   */
  private extractMarkdownLinks(content: string, filePath: string): Array<{link: string, line: number}> {
    const links: Array<{link: string, line: number}> = [];
    const lines = content.split('\n');
    
    // Regex patterns for markdown links
    const patterns = [
      /\[([^\]]*)\]\(([^)]+)\)/g,  // [text](link)
      /!\[([^\]]*)\]\(([^)]+)\)/g, // ![alt](image)
    ];

    lines.forEach((line, index) => {
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const link = match[2];
          // Skip external links
          if (!link.startsWith('http://') && 
              !link.startsWith('https://') && 
              !link.startsWith('mailto:') &&
              !link.startsWith('//')) {
            links.push({ link, line: index + 1 });
          }
        }
      });
    });

    return links;
  }

  /**
   * Validate a single link
   */
  private validateLink(link: string, sourceFile: string, isHtml: boolean = true): LinkValidationResult {
    const baseResult = {
      file: relative(process.cwd(), sourceFile),
      link,
      line: 0,
    };

    // Handle anchor links
    if (link.startsWith('#')) {
      return {
        ...baseResult,
        type: 'anchor',
        valid: true, // We'll assume anchors are valid for now
        reason: 'Anchor link (not validated)'
      };
    }

    // Handle absolute paths
    if (link.startsWith('/')) {
      return {
        ...baseResult,
        type: 'absolute',
        valid: false,
        reason: 'Absolute paths are not recommended for relative documentation'
      };
    }

    // Handle relative links
    const sourceDir = dirname(sourceFile);
    let targetPath: string;
    let anchorPart = '';

    // Split off anchor if present
    const anchorIndex = link.indexOf('#');
    let linkPath = link;
    if (anchorIndex > 0) {
      linkPath = link.substring(0, anchorIndex);
      anchorPart = link.substring(anchorIndex);
    }

    // Decode URL-encoded characters
    linkPath = decodeURIComponent(linkPath);

    if (isHtml) {
      // For HTML files in site directory
      targetPath = resolve(sourceDir, linkPath);
      
      // Check if it's a directory link (should have index.html)
      if (!linkPath.endsWith('.html') && !linkPath.endsWith('/')) {
        // Try with .html extension
        const htmlPath = targetPath + '.html';
        if (existsSync(htmlPath)) {
          targetPath = htmlPath;
        } else {
          // Try as directory with index.html
          const indexPath = join(targetPath, 'index.html');
          if (existsSync(indexPath)) {
            targetPath = indexPath;
          }
        }
      } else if (linkPath.endsWith('/')) {
        targetPath = join(targetPath, 'index.html');
      }
    } else {
      // For markdown files in docs directory
      targetPath = resolve(sourceDir, linkPath);
      
      // MkDocs converts .md to .html, so we need to check both
      if (linkPath.endsWith('.md')) {
        // Check if the .md file exists
        if (!existsSync(targetPath)) {
          // Try without .md and with various extensions
          const basePath = targetPath.slice(0, -3);
          if (existsSync(basePath + '.md')) {
            targetPath = basePath + '.md';
          }
        }
      } else if (!extname(linkPath)) {
        // No extension, could be a directory or file
        if (existsSync(targetPath + '.md')) {
          targetPath = targetPath + '.md';
        } else if (existsSync(join(targetPath, 'index.md'))) {
          targetPath = join(targetPath, 'index.md');
        }
      }
    }

    const exists = existsSync(targetPath);

    return {
      ...baseResult,
      type: 'relative',
      valid: exists,
      reason: exists ? undefined : `Target file not found: ${relative(process.cwd(), targetPath)}`,
      targetFile: exists ? relative(process.cwd(), targetPath) : undefined
    };
  }

  /**
   * Validate all links in HTML files
   */
  public validateHtmlFiles(): void {
    console.log(`\n🔍 Validating HTML files in ${this.siteDir}...\n`);
    
    if (!existsSync(this.siteDir)) {
      console.error(`❌ Site directory not found: ${this.siteDir}`);
      console.log('Please run "mkdocs build" first to generate the site.');
      return;
    }

    const htmlFiles = this.getAllHtmlFiles(this.siteDir);
    console.log(`Found ${htmlFiles.length} HTML files to validate.\n`);

    for (const file of htmlFiles) {
      const content = readFileSync(file, 'utf-8');
      const links = this.extractHtmlLinks(content, file);

      for (const { link, line } of links) {
        const result = this.validateLink(link, file, true);
        result.line = line;
        if (!result.valid) {
          this.results.push(result);
        }
      }
    }
  }

  /**
   * Validate all links in Markdown files
   */
  public validateMarkdownFiles(): void {
    console.log(`\n🔍 Validating Markdown files in ${this.sourceDir}...\n`);
    
    if (!existsSync(this.sourceDir)) {
      console.error(`❌ Docs directory not found: ${this.sourceDir}`);
      return;
    }

    const mdFiles = this.getAllMarkdownFiles(this.sourceDir);
    console.log(`Found ${mdFiles.length} Markdown files to validate.\n`);

    for (const file of mdFiles) {
      const content = readFileSync(file, 'utf-8');
      const links = this.extractMarkdownLinks(content, file);

      for (const { link, line } of links) {
        const result = this.validateLink(link, file, false);
        result.line = line;
        if (!result.valid) {
          this.results.push(result);
        }
      }
    }
  }

  /**
   * Print validation results
   */
  public printResults(): void {
    if (this.results.length === 0) {
      console.log('✅ All links are valid!\n');
      return;
    }

    console.log(`\n❌ Found ${this.results.length} broken links:\n`);
    console.log('=' .repeat(80));

    // Group results by file
    const resultsByFile = new Map<string, LinkValidationResult[]>();
    for (const result of this.results) {
      if (!resultsByFile.has(result.file)) {
        resultsByFile.set(result.file, []);
      }
      resultsByFile.get(result.file)!.push(result);
    }

    // Print results grouped by file
    for (const [file, fileResults] of resultsByFile) {
      console.log(`\n📄 ${file}`);
      console.log('-'.repeat(80));
      
      for (const result of fileResults) {
        console.log(`  Line ${result.line}: ${result.link}`);
        if (result.reason) {
          console.log(`    ⚠️  ${result.reason}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal: ${this.results.length} broken links found.`);
  }

  /**
   * Get validation results for programmatic use
   */
  public getResults(): LinkValidationResult[] {
    return this.results;
  }

  /**
   * Run full validation
   */
  public validate(): boolean {
    this.results = [];
    
    // Validate built HTML files
    this.validateHtmlFiles();
    
    // Also validate source markdown files for better debugging
    this.validateMarkdownFiles();
    
    this.printResults();
    
    return this.results.length === 0;
  }
}

// Main execution
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const validator = new DocumentationLinkValidator();
  const isValid = validator.validate();
  
  // Exit with error code if links are broken
  process.exit(isValid ? 0 : 1);
}

export { DocumentationLinkValidator };