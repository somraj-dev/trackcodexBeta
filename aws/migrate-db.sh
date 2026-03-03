#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# TrackCodex — Database Migration: Render PostgreSQL → AWS RDS
#
# USAGE:
#   1. Install psql client locally (or run this from any machine with network
#      access to both Render and RDS)
#   2. Fill in RENDER_DB_URL and AWS_RDS_URL below (or export as env vars)
#   3. Ensure RDS security group allows inbound TCP 5432 from your IP
#   4. chmod +x migrate-db.sh && ./migrate-db.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ─── Config ── Fill these in or export as environment variables ──────────────
RENDER_DB_URL="${RENDER_DB_URL:-postgresql://trackcodex_db_user:WGX7ejNBuI4zfkxPqsYW3duQup5XJ6XO@dpg-d6hbumbuibrs739sp0ng-a.singapore-postgres.render.com/trackcodex_db?sslmode=require}"
AWS_RDS_URL="${AWS_RDS_URL:-postgresql://<RDS_USER>:<RDS_PASSWORD>@trackcodex-db.cnie88q6ughh.ap-south-1.rds.amazonaws.com:5432/trackcodex_db}"
DUMP_FILE="/tmp/trackcodex_render_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "════════════════════════════════════════════════"
echo " TrackCodex DB Migration: Render → AWS RDS"
echo "════════════════════════════════════════════════"
echo ""

# ─── Preflight Checks ────────────────────────────────────────────────────────
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found. Install postgresql-client: sudo apt install postgresql-client"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Install postgresql-client: sudo apt install postgresql-client"
    exit 1
fi

if [[ "$AWS_RDS_URL" == *"<RDS_USER>"* ]]; then
    echo "❌ Please set AWS_RDS_URL before running this script!"
    echo "   export AWS_RDS_URL='postgresql://user:pass@your-rds-endpoint:5432/trackcodex_db'"
    exit 1
fi

# ─── Step 1: Dump from Render ────────────────────────────────────────────────
echo "⏳ [1/3] Dumping database from Render PostgreSQL..."
pg_dump \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    "$RENDER_DB_URL" \
    -f "$DUMP_FILE"

DUMP_SIZE=$(du -sh "$DUMP_FILE" | cut -f1)
echo "✅ Dump complete! File: $DUMP_FILE ($DUMP_SIZE)"

# ─── Step 2: Run Prisma Migrations on RDS ────────────────────────────────────
echo ""
echo "⏳ [2/3] Running Prisma migrations on AWS RDS..."
echo "   (This ensures the schema is up to date before restoring data)"
DATABASE_URL="$AWS_RDS_URL" npx prisma migrate deploy --schema=backend/schema.prisma
echo "✅ Prisma migrations applied to RDS"

# ─── Step 3: Restore to AWS RDS ──────────────────────────────────────────────
echo ""
echo "⏳ [3/3] Restoring data to AWS RDS..."
psql "$AWS_RDS_URL" < "$DUMP_FILE"
echo "✅ Data restored to AWS RDS successfully!"

# ─── Cleanup ─────────────────────────────────────────────────────────────────
rm -f "$DUMP_FILE"
echo ""
echo "════════════════════════════════════════════════"
echo " ✅ Migration Complete!"
echo "════════════════════════════════════════════════"
echo ""
echo "📋 NEXT STEPS:"
echo "  1. Update DATABASE_URL in your .env.prod on EC2 to your AWS RDS URL"
echo "  2. Update DATABASE_URL in GitHub Secrets / AWS Secrets Manager"
echo "  3. Verify data: psql \$AWS_RDS_URL -c 'SELECT COUNT(*) FROM \"User\";'"
echo "  4. Once verified, disable public access on RDS (only allow EC2 SG)"
