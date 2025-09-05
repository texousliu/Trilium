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
                # Look for markdown links like [text](path.md)
                import re
                from urllib.parse import unquote, quote
                pattern = r'\[([^\]]*)\]\(([^)]+\.md)\)'
                
                def fix_link(match):
                    text = match.group(1)
                    link = match.group(2)
                    
                    # Skip external links
                    if link.startswith('http'):
                        return match.group(0)
                    
                    # Decode URL-encoded paths for processing
                    decoded_link = unquote(link)
                    
                    # Resolve the link path relative to current file
                    current_dir = Path(root)
                    
                    # For any .md link, check if there's a directory with index.md
                    # that should be used instead
                    if not decoded_link.startswith('/'):
                        # Resolve relative to current directory
                        resolved_path = (current_dir / decoded_link).resolve()
                        
                        # Check if this points to a file that should be a directory
                        # Remove .md extension to get the potential directory name
                        if resolved_path.suffix == '.md':
                            potential_dir = resolved_path.with_suffix('')
                            potential_index = potential_dir / 'index.md'
                            
                            # If a directory with index.md exists, update the link
                            if potential_index.exists():
                                # Calculate relative path from current file to the directory
                                new_path = os.path.relpath(potential_dir, current_dir)
                                # Return link pointing to directory (MkDocs will serve index.md)
                                # Replace backslashes with forward slashes for consistency
                                new_path = new_path.replace('\\', '/')
                                # Re-encode spaces in the path for URL compatibility
                                new_path = new_path.replace(' ', '%20')
                                return f'[{text}]({new_path}/)'
                    
                    # Also handle local references (same directory)
                    elif '/' not in decoded_link:
                        basename = decoded_link[:-3]  # Remove .md
                        possible_dir = current_dir / basename
                        if possible_dir.exists() and possible_dir.is_dir():
                            # Re-encode spaces for URL compatibility
                            encoded_basename = basename.replace(' ', '%20')
                            return f'[{text}]({encoded_basename}/)'
                    
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