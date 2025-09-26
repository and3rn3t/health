#!/usr/bin/env python3
"""
Targeted duplicate remover for specific fileRef IDs
"""

import sys
import re

def remove_specific_duplicates(file_path):
    """Remove specific duplicate fileRef entries"""
    duplicate_refs = ['AB020020', 'AB02005E', 'AB020061']
    
    print(f"🎯 Targeting specific duplicates: {duplicate_refs}")
    
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    seen_refs = set()
    new_lines = []
    removed_count = 0
    
    for line in lines:
        # Check if this line contains one of our duplicate refs
        contains_duplicate = False
        for ref in duplicate_refs:
            if f'fileRef = {ref}' in line:
                if ref in seen_refs:
                    print(f"  🗑️  Removing duplicate line with fileRef {ref}")
                    removed_count += 1
                    contains_duplicate = True
                    break
                else:
                    seen_refs.add(ref)
                    break
        
        if not contains_duplicate:
            new_lines.append(line)
    
    # Write back the cleaned content
    with open(file_path, 'w') as f:
        f.writelines(new_lines)
    
    print(f"✅ Removed {removed_count} specific duplicate references")
    return removed_count > 0

if __name__ == "__main__":
    project_file = sys.argv[1] if len(sys.argv) > 1 else "VitalSense.xcodeproj/project.pbxproj"
    remove_specific_duplicates(project_file)