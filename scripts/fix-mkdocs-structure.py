#!/usr/bin/env python3
"""
Fix MkDocs structure by moving overview pages to index.md inside their directories.
This prevents duplicate navigation entries when a file and directory have the same name.
"""

import os
import shutil
from pathlib import Path

def fix_duplicate_entries(docs_dir):
    """
    Find markdown files that have a corresponding directory with the same name,
    and move them to index.md inside that directory.
    """
    fixes_made = []
    
    # Walk through all markdown files
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                basename = file[:-3]  # Remove .md extension
                dir_path = Path(root) / basename
                
                # Check if there's a directory with the same name
                if dir_path.exists() and dir_path.is_dir():
                    # Check if index.md already exists in that directory
                    index_path = dir_path / 'index.md'
                    if not index_path.exists():
                        # Move the file to index.md in the directory
                        shutil.move(str(file_path), str(index_path))
                        fixes_made.append(f"Moved {file_path.relative_to(docs_dir)} -> {index_path.relative_to(docs_dir)}")
                        
                        # Also move any associated images
                        for img_file in Path(root).glob(f"{basename}_*"):
                            if img_file.is_file():
                                img_dest = dir_path / img_file.name
                                shutil.move(str(img_file), str(img_dest))
                                fixes_made.append(f"Moved {img_file.relative_to(docs_dir)} -> {img_dest.relative_to(docs_dir)}")
                        
                        # Also move any images that match the pattern exactly
                        for img_ext in ['.png', '.jpg', '.jpeg', '.gif', '.svg']:
                            img_file = Path(root) / f"{basename}{img_ext}"
                            if img_file.exists():
                                img_dest = dir_path / img_file.name
                                shutil.move(str(img_file), str(img_dest))
                                fixes_made.append(f"Moved {img_file.relative_to(docs_dir)} -> {img_dest.relative_to(docs_dir)}")
    
    return fixes_made

def update_references(docs_dir):
    """
    Update references in markdown files to point to the new locations.
    """
    updates_made = []
    
    for root, dirs, files in os.walk(docs_dir):
        for file in files:
            if file.endswith('.md'):
                file_path = Path(root) / file
                content_changed = False
                
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    original_content = content
                
                # Update references to moved files
                # This is a simplified approach - you might need more sophisticated regex
                # for complex cases
                
                # Look for markdown links like [text](path.md)
                import re
                pattern = r'\[([^\]]*)\]\(([^)]+\.md)\)'
                
                def fix_link(match):
                    text = match.group(1)
                    link = match.group(2)
                    
                    # If the link doesn't contain a slash, it's a local reference
                    if '/' not in link and not link.startswith('http'):
                        # Check if this might be a moved file
                        basename = link[:-3]  # Remove .md
                        # If there's a directory with this name, update the link
                        possible_dir = Path(root) / basename
                        if possible_dir.exists() and possible_dir.is_dir():
                            # Point to the directory (which will serve index.md)
                            return f'[{text}]({basename}/)'
                    
                    return match.group(0)
                
                content = re.sub(pattern, fix_link, content)
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    updates_made.append(f"Updated references in {file_path.relative_to(docs_dir)}")
    
    return updates_made

def main():
    # Get the docs directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    docs_dir = project_root / 'docs'
    
    if not docs_dir.exists():
        print(f"Error: docs directory not found at {docs_dir}")
        return 1
    
    print(f"Fixing MkDocs structure in {docs_dir}")
    print("-" * 50)
    
    # Fix duplicate entries
    fixes = fix_duplicate_entries(docs_dir)
    if fixes:
        print("Files reorganized:")
        for fix in fixes:
            print(f"  - {fix}")
    else:
        print("No duplicate entries found that need fixing")
    
    print()
    
    # Update references
    updates = update_references(docs_dir)
    if updates:
        print("References updated:")
        for update in updates:
            print(f"  - {update}")
    else:
        print("No references needed updating")
    
    print("-" * 50)
    print(f"Structure fix complete: {len(fixes)} files moved, {len(updates)} files updated")
    
    return 0

if __name__ == '__main__':
    exit(main())