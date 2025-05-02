#!/bin/bash

set -e  # Exit on error
set -u  # Error on unset variables
set -o pipefail  # Fail if any part of a pipeline fails

# === Configuration ===
AWS_PROFILE="octopus-dev"
REGION="eu-west-2"
OUTPUT_ENV_FILE="postman.env.json"
POSTMAN_ENV_NAME="AWS SSO Temporary Credentials"

# === Functions ===
function log() {
  printf "%s\n" "$1"
}

function check_aws_sso_login() {
  log "🔐 Checking AWS SSO login..."
  if ! aws sts get-caller-identity --profile "$AWS_PROFILE" > /dev/null 2>&1; then
    log "🔗 Not logged in — running aws sso login..."
    aws sso login --profile "$AWS_PROFILE"
  else
    log "✅ Already logged in"
  fi
}

function export_temp_creds() {
  log "📦 Exporting temporary credentials..."
  ACCESS_KEY=$(aws configure export-credentials --profile "$AWS_PROFILE" | jq -r .AccessKeyId)
  SECRET_KEY=$(aws configure export-credentials --profile "$AWS_PROFILE" | jq -r .SecretAccessKey)
  SESSION_TOKEN=$(aws configure export-credentials --profile "$AWS_PROFILE" | jq -r .SessionToken)
}

function generate_postman_env() {
  log "💾 Writing Postman environment JSON: $OUTPUT_ENV_FILE"
  cat <<EOL > "$OUTPUT_ENV_FILE"
{
  "name": "$POSTMAN_ENV_NAME",
  "values": [
    { "key": "AWS_ACCESS_KEY_ID", "value": "$ACCESS_KEY", "enabled": true },
    { "key": "AWS_SECRET_ACCESS_KEY", "value": "$SECRET_KEY", "enabled": true },
    { "key": "AWS_SESSION_TOKEN", "value": "$SESSION_TOKEN", "enabled": true },
    { "key": "AWS_REGION", "value": "$REGION", "enabled": true },
    { "key": "AWS_SERVICE", "value": "execute-api", "enabled": true }
  ]
}
EOL
  log "✅ Environment file created at $OUTPUT_ENV_FILE"
}

# === Main Script ===
check_aws_sso_login
export_temp_creds
generate_postman_env

echo "🎉 Done! Import '$OUTPUT_ENV_FILE' into Postman (Manage Environments > Import)"
