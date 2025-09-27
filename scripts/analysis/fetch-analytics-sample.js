#!/usr/bin/env node
/*
  Fetch a few recent analytics datapoints via Cloudflare GraphQL API.
  Note: Requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN env vars.
  This script is optional and best-effort; it prints a tiny summary.
*/

async function reqGraphQL(query, variables) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN');
  }
  const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  return json;
}

async function main() {
  const dataset = process.argv[2] || 'HEALTH_ANALYTICS';
  const query = `
    query($accountTag: String!, $dataset: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          analyticsEngine(dataset: $dataset, limit: 10) {
            rows {
              time
              indexes
              blobs
              doubles
            }
          }
        }
      }
    }
  `;
  try {
    const out = await reqGraphQL(query, {
      accountTag: process.env.CLOUDFLARE_ACCOUNT_ID,
      dataset
    });
    const rows = out?.data?.viewer?.accounts?.[0]?.analyticsEngine?.rows || [];
    console.log(`Dataset: ${dataset}`);
    console.log(`Rows: ${rows.length}`);
    for (const r of rows) {
      console.log(JSON.stringify(r));
    }
  } catch (e) {
    console.error('Failed to fetch analytics:', e.message);
    process.exit(1);
  }
}

main();
