#!/usr/bin/env python3
"""
VitalSense Project Deduplicator
Removes duplicate file references from Xcode project files
"""

import re
import sys
from collections import defaultdict

def deduplicate_project_file(file_path):
    """Remove duplicate file references from an Xcode project file"""
    print(f"🔧 Deduplicating project file: {file_path}")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    # Track seen file references with their IDs
    seen_refs = {}
    seen_build_refs = {}
    duplicate_count = 0
    lines = content.split('\n')
    new_lines = []
    
    # Process each line
    for line in lines:
        # Check for PBXFileReference duplicates
        fileref_match = re.match(r'(\s+)([A-F0-9]+)\s+/\*\s+(.+?)\s+\*/\s+=\s+\{isa\s+=\s+PBXFileReference;', line)
        if fileref_match:
            indent, ref_id, filename = fileref_match.groups()
            key = filename.strip()
            
            if key in seen_refs:
                duplicate_count += 1
                print(f"  🗑️  Removing duplicate file reference: {filename}")
                continue  # Skip this line
            else:
                seen_refs[key] = ref_id
                new_lines.append(line)
                continue
        
        # Check for PBXBuildFile duplicates
        buildfile_match = re.match(r'(\s+)([A-F0-9]+)\s+/\*\s+(.+?)\s+(in\s+Sources)?\s*\*/\s+=\s+\{isa\s+=\s+PBXBuildFile;', line)
        if buildfile_match:
            indent, ref_id, filename, sources = buildfile_match.groups()
            key = filename.strip()
            
            if key in seen_build_refs:
                duplicate_count += 1
                print(f"  🗑️  Removing duplicate build reference: {filename}")
                continue  # Skip this line
            else:
                seen_build_refs[key] = ref_id
                new_lines.append(line)
                continue
        
        # Check for duplicate entries in build phases
        build_phase_match = re.match(r'(\s+)([A-F0-9]+)\s+/\*\s+(.+?)\s+in\s+Sources\s+\*/,?', line)
        if build_phase_match:
            indent, ref_id, filename = build_phase_match.groups()
            key = filename.strip()
            
            # Check if we've already seen this filename in build references
            if key in seen_build_refs and seen_build_refs[key] != ref_id:
                duplicate_count += 1
                print(f"  🗑️  Removing duplicate build phase entry: {filename}")
                continue
        
        # Keep all other lines
        new_lines.append(line)
    
    # Join lines back together
    new_content = '\n'.join(new_lines)
    
    # Clean up excessive empty lines
    new_content = re.sub(r'\n\s*\n\s*\n', '\n\n', new_content)
    
    if duplicate_count > 0:
        # Create backup before modifying
        backup_path = f"{file_path}.pre_dedup_backup"
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"📁 Backup created: {backup_path}")
        
        # Write the deduplicated content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✅ Removed {duplicate_count} duplicates")
        return True
    else:
        print("✅ No duplicates found")
        return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 deduplicate_project.py <project.pbxproj>")
        sys.exit(1)
    
    project_file = sys.argv[1]
    success = deduplicate_project_file(project_file)
    sys.exit(0 if success else 1)
