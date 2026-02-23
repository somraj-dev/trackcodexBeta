@echo off
git add .
git commit -m "Commit for trackcodexversion1"
git remote set-url origin https://github.com/Quantaforge-trackcodex/trackcodexversion1.git
git push -u origin main
echo DONE > done.txt
