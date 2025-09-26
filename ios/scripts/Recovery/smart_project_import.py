#!/usr/bin/env python3
"""
Smart Project Import - Fixes file categorization and duplicate issues
"""

import os
import re
from pathlib import Path

class SmartXcodeProjectBuilder:
    def __init__(self, project_path, source_path):
        self.project_path = Path(project_path)
        self.source_path = Path(source_path)
        self.pbxproj_path = self.project_path / "project.pbxproj"
        
        # Generate consistent UUIDs for project objects
        self.file_refs = {}
        self.build_files = {}
        
        # Counter for generating sequential IDs
        self.id_counter = 0x2000
        
    def generate_id(self):
        """Generate a unique 24-character hex ID for Xcode objects"""
        self.id_counter += 1
        return f"AB{self.id_counter:022X}"
    
    def should_include_file(self, file_path, file_name):
        """Determine if a file should be included in the main app target"""
        # Exclude files that shouldn't be in main target
        excluded_patterns = [
            'Test', 'UITest', 'Watch', 'Widget', 'Bridge',
            'build_', 'audit.', '.log', 'README',
            'Bridging-Header', 'sample', 'Sample'
        ]
        
        # Exclude specific directories
        excluded_dirs = [
            'VitalSenseTests', 'VitalSenseUITests',
            'VitalSenseTests', 'VitalSenseUITests',
            'VitalSense', 'VitalSenseWatch', 
            'VitalSenseWidgets', 'Generated', 'scripts'
        ]
        
        path_parts = Path(file_path).parts
        
        # Skip if in excluded directory
        for excluded_dir in excluded_dirs:
            if excluded_dir in path_parts:
                return False
        
        # Skip if filename matches excluded patterns
        for pattern in excluded_patterns:
            if pattern in file_name:
                return False
        
        # Only include main app files
        suffix = Path(file_name).suffix.lower()
        if suffix == '.swift':
            # Include Core and Features Swift files
            if any(part in ['Core', 'Features', 'UI', 'Configuration'] for part in path_parts):
                return True
            # Include main app files
            if file_name in ['VitalSenseApp.swift', 'VitalSenseBrand.swift', 'VitalSenseComponents.swift']:
                return True
            return False
        elif suffix in ['.plist']:
            # Only include main Info.plist
            return file_name == 'Info.plist' and 'VitalSense' not in str(file_path).replace('VitalSense/', '')
        elif suffix == '.entitlements':
            # Only include main app entitlements
            return file_name == 'VitalSense.entitlements'
        elif file_name == 'Assets.xcassets':
            # Include main assets only
            return 'VitalSense/' not in str(file_path) or str(file_path).count('/') <= 1
        
        return False
    
    def scan_smart_files(self):
        """Scan and intelligently categorize files for main app target"""
        print("🧠 Smart scanning for main app files...")
        
        source_files = []
        excluded_files = {'.DS_Store', 'build.log', 'audit.out', 'build_fix.log', 'build_full.log'}
        
        for root, dirs, files in os.walk(self.source_path):
            # Skip hidden and build directories
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['build', 'DerivedData']]
            
            for file in files:
                if file in excluded_files:
                    continue
                    
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.source_path)
                
                if not self.should_include_file(str(relative_path), file):
                    continue
                
                # Determine file type and category
                suffix = file_path.suffix.lower()
                if suffix == '.swift':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'sourcecode.swift',
                        'category': 'source'
                    })
                elif suffix == '.plist' and file == 'Info.plist':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'text.plist.xml',
                        'category': 'resource'
                    })
                elif suffix == '.entitlements':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'text.plist.entitlements',
                        'category': 'entitlements'  # Special category
                    })
                elif file == 'Assets.xcassets':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'folder.assetcatalog',
                        'category': 'resource'
                    })
        
        print(f"✅ Smart scan found {len(source_files)} relevant files for main target")
        return source_files
    
    def build_smart_project(self, files):
        """Build a smart, properly configured Xcode project"""
        print("🏗️  Building smart project configuration...")
        
        # Generate all necessary IDs
        main_group_id = self.generate_id()
        products_group_id = self.generate_id() 
        vitalsense_group_id = self.generate_id()
        main_target_id = self.generate_id()
        main_product_id = self.generate_id()
        sources_phase_id = self.generate_id()
        frameworks_phase_id = self.generate_id()
        resources_phase_id = self.generate_id()
        target_config_list_id = self.generate_id()
        project_config_list_id = self.generate_id()
        target_debug_config_id = self.generate_id()
        target_release_config_id = self.generate_id()
        project_debug_config_id = self.generate_id()
        project_release_config_id = self.generate_id()
        project_object_id = self.generate_id()
        
        # Build file sections
        file_references = []
        build_file_entries = []
        source_build_files = []
        resource_build_files = []
        
        # Add product reference first
        file_references.append(f'\t\t{main_product_id} /* VitalSense.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = VitalSense.app; sourceTree = BUILT_PRODUCTS_DIR; }};')
        
        # Process each file intelligently
        for file_info in files:
            file_ref_id = self.generate_id()
            self.file_refs[file_info['path']] = file_ref_id
            
            # Create file reference
            file_references.append(f'\t\t{file_ref_id} /* {file_info["name"]} */ = {{isa = PBXFileReference; lastKnownFileType = {file_info["type"]}; path = "{file_info["path"]}"; sourceTree = "<group>"; }};')
            
            # Create build file based on category
            if file_info['category'] == 'source':
                build_file_id = self.generate_id()
                build_file_entries.append(f'\t\t{build_file_id} /* {file_info["name"]} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {file_info["name"]} */; }};')
                source_build_files.append(f'\t\t\t\t{build_file_id} /* {file_info["name"]} in Sources */,')
            elif file_info['category'] == 'resource':
                build_file_id = self.generate_id() 
                build_file_entries.append(f'\t\t{build_file_id} /* {file_info["name"]} in Resources */ = {{isa = PBXBuildFile; fileRef = {file_ref_id} /* {file_info["name"]} */; }};')
                resource_build_files.append(f'\t\t\t\t{build_file_id} /* {file_info["name"]} in Resources */,')
            # Entitlements files are referenced but not added to build phases
        
        # Build file children list for groups
        file_children = []
        for f in files:
            file_children.append(f'\t\t\t\t{self.file_refs[f["path"]]} /* {f["name"]} */,')
        
        # Create the complete project content
        project_content = f"""// !$*UTF8*$!
{{
\tarchiveVersion = 1;
\tclasses = {{
\t}};
\tobjectVersion = 77;
\tobjects = {{

/* Begin PBXBuildFile section */
{chr(10).join(build_file_entries)}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
{chr(10).join(file_references)}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
\t\t{frameworks_phase_id} /* Frameworks */ = {{
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
\t\t{main_group_id} = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{vitalsense_group_id} /* VitalSense */,
\t\t\t\t{products_group_id} /* Products */,
\t\t\t);
\t\t\tsourceTree = "<group>";
\t\t}};
\t\t{products_group_id} /* Products */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{main_product_id} /* VitalSense.app */,
\t\t\t);
\t\t\tname = Products;
\t\t\tsourceTree = "<group>";
\t\t}};
\t\t{vitalsense_group_id} /* VitalSense */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
{chr(10).join(file_children)}
\t\t\t);
\t\t\tpath = VitalSense;
\t\t\tsourceTree = "<group>";
\t\t}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
\t\t{main_target_id} /* VitalSense */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {target_config_list_id} /* Build configuration list for PBXNativeTarget "VitalSense" */;
\t\t\tbuildPhases = (
\t\t\t\t{sources_phase_id} /* Sources */,
\t\t\t\t{frameworks_phase_id} /* Frameworks */,
\t\t\t\t{resources_phase_id} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = VitalSense;
\t\t\tproductName = VitalSense;
\t\t\tproductReference = {main_product_id} /* VitalSense.app */;
\t\t\tproductType = "com.apple.product-type.application";
\t\t}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
\t\t{project_object_id} /* Project object */ = {{
\t\t\tisa = PBXProject;
\t\t\tattributes = {{
\t\t\t\tBuildIndependentTargetsInParallel = 1;
\t\t\t\tLastSwiftUpdateCheck = 1600;
\t\t\t\tLastUpgradeCheck = 1600;
\t\t\t\tTargetAttributes = {{
\t\t\t\t\t{main_target_id} = {{
\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;
\t\t\t\t\t}};
\t\t\t\t}};
\t\t\t}};
\t\t\tbuildConfigurationList = {project_config_list_id} /* Build configuration list for PBXProject "VitalSense" */;
\t\t\tdevelopmentRegion = en;
\t\t\thasScannedForEncodings = 0;
\t\t\tknownRegions = (
\t\t\t\ten,
\t\t\t\tBase,
\t\t\t);
\t\t\tmainGroup = {main_group_id};
\t\t\tproductRefGroup = {products_group_id} /* Products */;
\t\t\tprojectDirPath = "";
\t\t\tprojectRoot = "";
\t\t\ttargets = (
\t\t\t\t{main_target_id} /* VitalSense */,
\t\t\t);
\t\t}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
\t\t{resources_phase_id} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
{chr(10).join(resource_build_files)}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
\t\t{sources_phase_id} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
{chr(10).join(source_build_files)}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
\t\t{project_debug_config_id} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ANALYZER_NONNULL = YES;
\t\t\t\tCLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;
\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;
\t\t\t\tCLANG_WARN_DOCUMENTATION_COMMENTS = YES;
\t\t\t\tCOPY_PHASE_STRIP = NO;
\t\t\t\tDEBUG_INFORMATION_FORMAT = dwarf;
\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;
\t\t\t\tENABLE_TESTABILITY = YES;
\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu17;
\t\t\t\tGCC_DYNAMIC_NO_PIC = NO;
\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;
\t\t\t\tGCC_OPTIMIZATION_LEVEL = 0;
\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = (
\t\t\t\t\t"DEBUG=1",
\t\t\t\t\t"$$(inherited)",
\t\t\t\t);
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 18.0;
\t\t\t\tMTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
\t\t\t\tMTL_FAST_MATH = YES;
\t\t\t\tONLY_ACTIVE_ARCH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG $$(inherited)";
\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-Onone";
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{project_release_config_id} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ANALYZER_NONNULL = YES;
\t\t\t\tCLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;
\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;
\t\t\t\tCLANG_WARN_DOCUMENTATION_COMMENTS = YES;
\t\t\t\tCOPY_PHASE_STRIP = NO;
\t\t\t\tDEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
\t\t\t\tENABLE_NS_ASSERTIONS = NO;
\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;
\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu17;
\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 18.0;
\t\t\t\tMTL_ENABLE_DEBUG_INFO = NO;
\t\t\t\tMTL_FAST_MATH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_COMPILATION_MODE = wholemodule;
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t\tVALIDATE_PRODUCT = YES;
\t\t\t}};
\t\t\tname = Release;
\t\t}};
\t\t{target_debug_config_id} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_ENTITLEMENTS = VitalSense/VitalSense.entitlements;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = VitalSense/Info.plist;
\t\t\t\tINFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
\t\t\t\tINFOPLIST_KEY_UILaunchStoryboardName = LaunchScreen;
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vitalsense.app;
\t\t\t\tPRODUCT_NAME = "$$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{target_release_config_id} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_ENTITLEMENTS = VitalSense/VitalSense.entitlements;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = VitalSense/Info.plist;
\t\t\t\tINFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
\t\t\t\tINFOPLIST_KEY_UILaunchStoryboardName = LaunchScreen;
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vitalsense.app;
\t\t\t\tPRODUCT_NAME = "$$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Release;
\t\t}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
\t\t{project_config_list_id} /* Build configuration list for PBXProject "VitalSense" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{project_debug_config_id} /* Debug */,
\t\t\t\t{project_release_config_id} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
\t\t{target_config_list_id} /* Build configuration list for PBXNativeTarget "VitalSense" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{target_debug_config_id} /* Debug */,
\t\t\t\t{target_release_config_id} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
/* End XCConfigurationList section */

\t}};
\trootObject = {project_object_id} /* Project object */;
}}"""
        
        return project_content
    
    def import_project(self):
        """Smart import of the project"""
        print("🚀 Starting smart VitalSense project import...")
        
        # Smart file scanning
        files = self.scan_smart_files()
        
        # Build smart project
        project_content = self.build_smart_project(files)
        
        # Write project file
        print("💾 Writing smart project file...")
        with open(self.pbxproj_path, 'w') as f:
            f.write(project_content)
        
        print("✅ Smart project import completed successfully!")
        print(f"📊 Imported {len(files)} carefully selected files")
        print(f"🎯 Configured for single main target without conflicts")
        
        return True

def main():
    """Main execution function"""
    project_path = "/Users/ma55700/Documents/GitHub/Health-2/VitalSense.xcodeproj"
    source_path = "/Users/ma55700/Documents/GitHub/Health-2/VitalSense"
    
    if not os.path.exists(source_path):
        print(f"❌ Source path not found: {source_path}")
        return False
    
    if not os.path.exists(project_path):
        print(f"❌ Project path not found: {project_path}")
        return False
    
    builder = SmartXcodeProjectBuilder(project_path, source_path)
    return builder.import_project()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)