#!/bin/bash

# Create temporary directory
mkdir temp-npm-reservation
cd temp-npm-reservation

# Create package.json
cat > package.json << 'EOF'
{
  "name": "react-codebase-guru",
  "version": "0.0.1",
  "description": "Coming soon - React codebase consultation and drift detection",
  "main": "index.js",
  "keywords": ["react", "codebase", "ai", "consistency", "drift"],
  "author": "Lyle Jensen",
  "license": "MIT"
}
EOF

# Create placeholder index.js
echo "console.log('React Codebase Guru - Coming soon!');" > index.js

# Login and publish
echo "Now run these commands:"
echo "npm login"
echo "npm publish"
echo "cd .."
echo "rm -rf temp-npm-reservation"
