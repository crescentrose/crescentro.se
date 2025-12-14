#!/usr/bin/env nu

echo "Cleaning up..."
rm -rf public/

echo "Building site..."
zola build

echo "Building slides: cloud-basics..."
pnpm run -C ./content/slides/cloud-basics/slidev/ build -o $"(pwd)/public/slides/cloud-basics/play/" --base '/slides/cloud-basics/play/'
