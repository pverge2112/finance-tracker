#!/bin/sh
set -e

# Run database seed based on SEED_DB setting
# SEED_DB=true  - seed only if database is empty
# SEED_DB=force - clear and reseed database
# unset/false   - skip seeding
if [ "$SEED_DB" = "force" ]; then
  echo "Force seeding database..."
  node dist/seed.js --force
elif [ "$SEED_DB" = "true" ] || [ ! -f "$DB_PATH" ]; then
  echo "Seeding database..."
  node dist/seed.js
fi

# Start the server
exec node dist/index.js
