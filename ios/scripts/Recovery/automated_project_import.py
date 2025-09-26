#!/usr/bin/env python3
"""
VitalSense Automated Project Import Script - Fixed Version
Automatically imports all source files and configures multiple targets
"""

import os
import re
from pathlib import Path

class XcodeProjectBuilder:
    def __init__(self, project_path, source_path):
        self.project_path = Path(project_path)
        self.source_path = Path(source_path)
        self.pbxproj_path = self.project_path / "project.pbxproj"
        
        # Generate consistent UUIDs for project objects
        self.file_refs = {}
        self.build_files = {}
        self.groups = {}
        self.targets = {}
        self.product_refs = {}
        
        # Counter for generating sequential IDs
        self.id_counter = 0x1000
        
    def generate_id(self):
        """Generate a unique 24-character hex ID for Xcode objects"""
        self.id_counter += 1
        return f"AB{self.id_counter:022X}"
    
    def scan_source_files(self):
        """Scan the VitalSense directory for all source files"""
        print("🔍 Scanning source files...")
        
        source_files = []
        excluded_dirs = {'.git', 'build', 'DerivedData', '.DS_Store', '__pycache__', 'VitalSense.xcodeproj'}
        excluded_files = {'.DS_Store', 'build.log', 'audit.out', 'build_fix.log', 'build_full.log'}
        
        for root, dirs, files in os.walk(self.source_path):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if d not in excluded_dirs]
            
            for file in files:
                if file in excluded_files:
                    continue
                    
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.source_path)
                
                # Determine file type and category
                suffix = file_path.suffix.lower()
                if suffix == '.swift':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'sourcecode.swift',
                        'category': 'source'
                    })
                elif suffix in ['.plist']:
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
                        'category': 'resource'
                    })
                elif file == 'Assets.xcassets':
                    source_files.append({
                        'path': str(relative_path),
                        'name': file,
                        'type': 'folder.assetcatalog',
                        'category': 'resource'
                    })
        
        print(f"✅ Found {len(source_files)} files to import")
        return source_files
    
    def build_complete_project(self, files):
        """Build a complete, valid Xcode project file"""
        print("🏗️  Building complete project file...")
        
        # Create all necessary IDs first
        main_group_id = self.generate_id()
        products_group_id = self.generate_id()
        vitalsense_group_id = self.generate_id()
        
        # Main target IDs
        main_target_id = self.generate_id()
        main_product_id = self.generate_id()
        sources_phase_id = self.generate_id()
        frameworks_phase_id = self.generate_id()
        resources_phase_id = self.generate_id()
        
        # Build configurations
        target_config_list_id = self.generate_id()
        project_config_list_id = self.generate_id()
        target_debug_config_id = self.generate_id()
        target_release_config_id = self.generate_id()
        project_debug_config_id = self.generate_id()
        project_release_config_id = self.generate_id()
        project_object_id = self.generate_id()
        
        # Create file references and build files
        file_references = []
        build_file_entries = []
        source_build_files = []
        resource_build_files = []
        
        # Add product reference
        file_references.append('\t\t' + main_product_id + ' /* VitalSense.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = VitalSense.app; sourceTree = BUILT_PRODUCTS_DIR; };')
        
        for file_info in files:
            file_ref_id = self.generate_id()
            self.file_refs[file_info['path']] = file_ref_id
            
            # Create file reference
            file_references.append('\t\t' + file_ref_id + ' /* ' + file_info["name"] + ' */ = {isa = PBXFileReference; lastKnownFileType = ' + file_info["type"] + '; path = "' + file_info["path"] + '"; sourceTree = "<group>"; };')
            
            # Create build file if it's a source file
            if file_info['category'] == 'source':
                build_file_id = self.generate_id()
                build_file_entries.append('\t\t' + build_file_id + ' /* ' + file_info["name"] + ' in Sources */ = {isa = PBXBuildFile; fileRef = ' + file_ref_id + ' /* ' + file_info["name"] + ' */; };')
                source_build_files.append('\t\t\t\t' + build_file_id + ' /* ' + file_info["name"] + ' in Sources */,')
            elif file_info['category'] == 'resource':
                build_file_id = self.generate_id()
                build_file_entries.append('\t\t' + build_file_id + ' /* ' + file_info["name"] + ' in Resources */ = {isa = PBXBuildFile; fileRef = ' + file_ref_id + ' /* ' + file_info["name"] + ' */; };')
                resource_build_files.append('\t\t\t\t' + build_file_id + ' /* ' + file_info["name"] + ' in Resources */,')
        
        # Build file references for children
        file_children = []
        for f in files:
            file_children.append('\t\t\t\t' + self.file_refs[f["path"]] + ' /* ' + f["name"] + ' */,')
        
        # Build the complete project file
        project_content = """// !$*UTF8*$!
{
\tarchiveVersion = 1;
\tclasses = {
\t};
\tobjectVersion = 77;
\tobjects = {

/* Begin PBXBuildFile section */
""" + '\n'.join(build_file_entries) + """
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
""" + '\n'.join(file_references) + """
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
\t\t""" + frameworks_phase_id + """ /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
\t\t""" + main_group_id + """ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t""" + vitalsense_group_id + """ /* VitalSense */,
\t\t\t\t""" + products_group_id + """ /* Products */,
\t\t\t);
\t\t\tsourceTree = "<group>";
\t\t};
\t\t""" + products_group_id + """ /* Products */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t""" + main_product_id + """ /* VitalSense.app */,
\t\t\t);
\t\t\tname = Products;
\t\t\tsourceTree = "<group>";
\t\t};
\t\t""" + vitalsense_group_id + """ /* VitalSense */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
""" + '\n'.join(file_children) + """
\t\t\t);
\t\t\tpath = VitalSense;
\t\t\tsourceTree = "<group>";
\t\t};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
\t\t""" + main_target_id + """ /* VitalSense */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = """ + target_config_list_id + """ /* Build configuration list for PBXNativeTarget "VitalSense" */;
\t\t\tbuildPhases = (
\t\t\t\t""" + sources_phase_id + """ /* Sources */,
\t\t\t\t""" + frameworks_phase_id + """ /* Frameworks */,
\t\t\t\t""" + resources_phase_id + """ /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = VitalSense;
\t\t\tproductName = VitalSense;
\t\t\tproductReference = """ + main_product_id + """ /* VitalSense.app */;
\t\t\tproductType = "com.apple.product-type.application";
\t\t};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
\t\t""" + project_object_id + """ /* Project object */ = {
\t\t\tisa = PBXProject;
\t\t\tattributes = {
\t\t\t\tBuildIndependentTargetsInParallel = 1;
\t\t\t\tLastSwiftUpdateCheck = 1600;
\t\t\t\tLastUpgradeCheck = 1600;
\t\t\t\tTargetAttributes = {
\t\t\t\t\t""" + main_target_id + """ = {
\t\t\t\t\t\tCreatedOnToolsVersion = 16.0;
\t\t\t\t\t};
\t\t\t\t};
\t\t\t};
\t\t\tbuildConfigurationList = """ + project_config_list_id + """ /* Build configuration list for PBXProject "VitalSense" */;
\t\t\tdevelopmentRegion = en;
\t\t\thasScannedForEncodings = 0;
\t\t\tknownRegions = (
\t\t\t\ten,
\t\t\t\tBase,
\t\t\t);
\t\t\tmainGroup = """ + main_group_id + """;
\t\t\tproductRefGroup = """ + products_group_id + """ /* Products */;
\t\t\tprojectDirPath = "";
\t\t\tprojectRoot = "";
\t\t\ttargets = (
\t\t\t\t""" + main_target_id + """ /* VitalSense */,
\t\t\t);
\t\t};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
\t\t""" + resources_phase_id + """ /* Resources */ = {
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
""" + '\n'.join(resource_build_files) + """
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
\t\t""" + sources_phase_id + """ /* Sources */ = {
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
""" + '\n'.join(source_build_files) + """
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
\t\t""" + project_debug_config_id + """ /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
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
\t\t\t\t\t"$(inherited)",
\t\t\t\t);
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 18.0;
\t\t\t\tMTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
\t\t\t\tMTL_FAST_MATH = YES;
\t\t\t\tONLY_ACTIVE_ARCH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG $(inherited)";
\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-Onone";
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t};
\t\t\tname = Debug;
\t\t};
\t\t""" + project_release_config_id + """ /* Release */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
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
\t\t\t};
\t\t\tname = Release;
\t\t};
\t\t""" + target_debug_config_id + """ /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = YES;
\t\t\t\tINFOPLIST_FILE = VitalSense/Info.plist;
\t\t\t\tINFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
\t\t\t\tINFOPLIST_KEY_UILaunchStoryboardName = LaunchScreen;
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vitalsense.app;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Debug;
\t\t};
\t\t""" + target_release_config_id + """ /* Release */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tGENERATE_INFOPLIST_FILE = YES;
\t\t\t\tINFOPLIST_FILE = VitalSense/Info.plist;
\t\t\t\tINFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents = YES;
\t\t\t\tINFOPLIST_KEY_UILaunchStoryboardName = LaunchScreen;
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPad = "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tINFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone = "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight";
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.vitalsense.app;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Release;
\t\t};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
\t\t""" + project_config_list_id + """ /* Build configuration list for PBXProject "VitalSense" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t""" + project_debug_config_id + """ /* Debug */,
\t\t\t\t""" + project_release_config_id + """ /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
\t\t""" + target_config_list_id + """ /* Build configuration list for PBXNativeTarget "VitalSense" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t""" + target_debug_config_id + """ /* Debug */,
\t\t\t\t""" + target_release_config_id + """ /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
/* End XCConfigurationList section */

\t};
\trootObject = """ + project_object_id + """ /* Project object */;
}"""
        
        return project_content
    
    def import_project(self):
        """Main method to import the entire project"""
        print("🚀 Starting VitalSense project import...")
        
        # Scan source files
        files = self.scan_source_files()
        
        # Build project file
        project_content = self.build_complete_project(files)
        
        # Write project file
        print("💾 Writing project file...")
        with open(self.pbxproj_path, 'w') as f:
            f.write(project_content)
        
        print("✅ Project import completed successfully!")
        print(f"📊 Imported {len(files)} files")
        print(f"🎯 Main target configured with all source files")
        
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
    
    builder = XcodeProjectBuilder(project_path, source_path)
    return builder.import_project()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
