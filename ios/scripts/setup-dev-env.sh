#!/bin/bash

#!/bin/bash

# VitalSense Monitor Development Environment Setup
# This script sets up optimal terminal, git, and development workflows

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛠️  Development Environment Enhancement${NC}"
echo "========================================="

# Check and install useful tools
check_and_install() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${YELLOW}Installing $1...${NC}"
        if command -v brew &> /dev/null; then
            brew install $1
        else
            echo -e "${YELLOW}Homebrew not found. Please install $1 manually.${NC}"
        fi
    else
        echo -e "${GREEN}✅ $1 already installed${NC}"
    fi
}

# Essential development tools
echo -e "${GREEN}Checking development tools...${NC}"
check_and_install "git"
check_and_install "gh"  # GitHub CLI
check_and_install "jq"  # JSON processor
check_and_install "tree"  # Directory tree view

# Git configuration improvements
echo -e "${GREEN}Optimizing Git configuration...${NC}"
git config --global core.autocrlf input
git config --global core.editor "code --wait"
git config --global merge.tool "code"
git config --global diff.tool "code"
git config --global push.default current
git config --global pull.rebase true
git config --global init.defaultBranch main

# Git aliases for better workflow
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.graph 'log --oneline --graph --decorate --all'
git config --global alias.cleanup '!git branch --merged | grep -v "\*\|main\|master" | xargs -n 1 git branch -d'

echo -e "${GREEN}✅ Development environment optimized!${NC}"