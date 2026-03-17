@echo off
echo [STEP 1] git add .
git add .
echo [STEP 2] git commit
git commit -m "Resolve merge conflicts" --no-verify --no-gpg-sign
echo [STEP 3] git status
git status
