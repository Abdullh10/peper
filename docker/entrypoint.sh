#!/bin/sh
set -e

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/pdfs" "$DATA_DIR/db"

rm -rf ./public/uploads
ln -s "$DATA_DIR/uploads" ./public/uploads

mkdir -p ./storage
rm -rf ./storage/pdfs
ln -s "$DATA_DIR/pdfs" ./storage/pdfs

npx prisma migrate deploy

exec npm run start
