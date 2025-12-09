#!/bin/sh
set -e

# Run database seed if SEED_DB is set to true or if database doesn't exist
if [ "$SEED_DB" = "true" ] || [ ! -f "$DB_PATH" ]; then
  echo "Seeding database..."
  node dist/seed.js
fi

# Start the server
exec node dist/index.js
