#!/usr/bin/env bash
# «Empresa»'s Azure Blob storage (E-26, ADR-127 §4), with the Azure CLI, from a
# trusted machine signed in with `az login`. Run it once; every step but the
# lock is safe to repeat.
#
#   ./scripts/corp-blob-provision.sh <resource-group> <account> [location] [origin]
#   ./scripts/corp-blob-provision.sh <resource-group> <account> [location] [origin] --bloquear
#
#   location  defaults to mexicocentral
#   origin    the console's origin for CORS, defaults to https://admin.xangarro.mx
#
# What it makes:
#   - a StorageV2 account: HTTPS only, TLS 1.2, no public blob access, ZRS;
#   - `corp-docs` (private): the kept files, under a time-based immutability
#     policy of 1826 days (five years, CFF art. 30);
#   - `corp-entrantes` (private): the browser's inbox, emptied after a day by a
#     lifecycle rule;
#   - CORS: the console may PUT into the account, nothing else.
#
# `--bloquear` LOCKS the policy. A locked policy cannot be shortened or removed
# by anyone, Microsoft support included, and the account cannot be deleted
# while it holds a blob under retention. Run it only once the console works
# against the container. It then proves the lock: a test blob cannot be
# overwritten or deleted (that blob stays five years; it is a few bytes).
#
# The account key is never printed. Set the console's CORP_BLOB_ACCOUNT and
# CORP_BLOB_KEY (the command below prints how to read the key) in Vercel.
set -euo pipefail

RG="${1:?resource group}"
ACCOUNT="${2:?storage account name}"
LOCATION="${3:-mexicocentral}"
ORIGIN="${4:-https://admin.xangarro.mx}"
LOCK="${5:-}"
DOCS=corp-docs
INBOX=corp-entrantes
RETENTION_DAYS=1826

az storage account create -g "$RG" -n "$ACCOUNT" -l "$LOCATION" \
  --kind StorageV2 --sku Standard_ZRS --https-only true --min-tls-version TLS1_2 \
  --allow-blob-public-access false --output none
echo "account $ACCOUNT ready in $LOCATION"

for c in "$DOCS" "$INBOX"; do
  az storage container-rm create -g "$RG" --storage-account "$ACCOUNT" -n "$c" \
    --public-access off --output none
done
echo "containers $DOCS and $INBOX ready"

az storage container immutability-policy create -g "$RG" --account-name "$ACCOUNT" \
  --container-name "$DOCS" --period "$RETENTION_DAYS" --allow-protected-append-writes false \
  --output none
echo "$DOCS: time-based retention of $RETENTION_DAYS days (unlocked)"

POLICY="$(mktemp)"
trap 'rm -f "$POLICY"' EXIT
cat >"$POLICY" <<JSON
{ "rules": [ { "enabled": true, "name": "vaciar-entrantes", "type": "Lifecycle",
  "definition": { "filters": { "blobTypes": ["blockBlob"], "prefixMatch": ["$INBOX/"] },
  "actions": { "baseBlob": { "delete": { "daysAfterModificationGreaterThan": 1 } } } } } ] }
JSON
az storage account management-policy create -g "$RG" --account-name "$ACCOUNT" \
  --policy "@$POLICY" --output none
echo "$INBOX: emptied after a day"

KEY="$(az storage account keys list -g "$RG" -n "$ACCOUNT" --query '[0].value' -o tsv)"
az storage cors clear --services b --account-name "$ACCOUNT" --account-key "$KEY"
az storage cors add --services b --methods PUT --origins "$ORIGIN" \
  --allowed-headers 'x-ms-blob-type,content-type' --max-age 3600 \
  --account-name "$ACCOUNT" --account-key "$KEY"
echo "CORS: $ORIGIN may PUT"

if [ "$LOCK" = "--bloquear" ]; then
  ETAG="$(az storage container immutability-policy show -g "$RG" --account-name "$ACCOUNT" \
    --container-name "$DOCS" --query etag -o tsv)"
  az storage container immutability-policy lock -g "$RG" --account-name "$ACCOUNT" \
    --container-name "$DOCS" --if-match "$ETAG" --output none
  echo "$DOCS: policy LOCKED"
  PROBE="verificacion-bloqueo-$(date +%Y%m%d%H%M%S)"
  echo "prueba" | az storage blob upload --account-name "$ACCOUNT" --account-key "$KEY" \
    -c "$DOCS" -n "$PROBE" --data @- --output none
  if echo "otra" | az storage blob upload --account-name "$ACCOUNT" --account-key "$KEY" \
    -c "$DOCS" -n "$PROBE" --data @- --overwrite --output none 2>/dev/null; then
    echo "FAIL: the container let a blob be overwritten" >&2; exit 1
  fi
  if az storage blob delete --account-name "$ACCOUNT" --account-key "$KEY" \
    -c "$DOCS" -n "$PROBE" --output none 2>/dev/null; then
    echo "FAIL: the container let a blob be deleted" >&2; exit 1
  fi
  echo "verified: $PROBE can be neither overwritten nor deleted"
fi

cat <<NEXT

Set in Vercel (backoffice, Production):
  CORP_BLOB_ACCOUNT=$ACCOUNT
  CORP_BLOB_KEY=<az storage account keys list -g $RG -n $ACCOUNT --query '[0].value' -o tsv>
Then move the files kept so far:
  pnpm --filter @xangarro/backoffice corp-blobs:move --aplicar
NEXT
