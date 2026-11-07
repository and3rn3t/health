#!/usr/bin/env sh
# PostToolUse hook: run the repo's Prettier on the file Claude just edited.
# Silent no-op when the repo has no local Prettier (Python/Xcode repos, fresh clones).
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x node_modules/.bin/prettier ] || exit 0
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).tool_input?.file_path??"")}catch{}})')
[ -n "$file" ] || exit 0
node_modules/.bin/prettier --write --ignore-unknown "$file" >/dev/null 2>&1
exit 0
