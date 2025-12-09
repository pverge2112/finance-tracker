#!/bin/sh
set -e

# Replace API URL placeholder in built JS files if API_URL env var is set
if [ -n "$API_URL" ]; then
    find /usr/share/nginx/html -name '*.js' -exec sed -i "s|http://localhost:3001/api|$API_URL|g" {} \;
fi

exec "$@"
