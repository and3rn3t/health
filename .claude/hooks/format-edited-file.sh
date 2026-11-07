#!/usr/bin/env sh
# PostToolUse hook: format the file Claude just edited with the nearest Prettier
# install — walking up from the file to the project root, so monorepo packages
# (web/, apps/*) use their own. Silent no-op when there is none (Python/Xcode
# repos, fresh clones without node_modules).
root="${CLAUDE_PROJECT_DIR:-$PWD}"
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path??"")}catch{}})' 2>/dev/null)
[ -n "$file" ] && [ -f "$file" ] || exit 0
case "$file" in "$root"/*) ;; *) exit 0 ;; esac

dir=$(dirname "$file")
while :; do
  if [ -x "$dir/node_modules/.bin/prettier" ]; then
    # Run from the package dir: Prettier resolves .prettierignore/.gitignore
    # against the cwd and silently skips files outside it.
    cd "$dir" && ./node_modules/.bin/prettier --write --ignore-unknown "$file" >/dev/null 2>&1
    exit 0
  fi
  [ "$dir" = "$root" ] || [ "$dir" = "/" ] && exit 0
  dir=$(dirname "$dir")
done
