import { jsonResponse } from '../utils';

// Worker 환경에 대한 타입 정의
interface Env {
  DB: D1Database;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  D1_DATABASE_ID: string;
}

export async function handleInsights(
  params: URLSearchParams,
  env: Env,  
  headers: Headers 
) { 
    // wrangler d1 insights --timePeriod=1d 와 동일하게 지난 24시간을 설정합니다.
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // GraphQL 쿼리 정의
    const query = `
      query getD1Analytics($accountTag: string!, $filter: D1AnalyticsAdaptiveGroupsFilter_InputObject!) {
        viewer {
          accounts(filter: {accountTag: $accountTag}) {
            d1AnalyticsAdaptiveGroups(filter: $filter, limit: 10000, orderBy: [datetime_ASC]) {
              sum {
                readQueries
                writeQueries
                queryTimeMs
              }
              dimensions {
                datetime
                query
              }
            }
          }
        }
      }
    `;

    // GraphQL 변수 설정
    const variables = {
      accountTag: env.CLOUDFLARE_ACCOUNT_ID,
      filter: {
        datetime_geq: oneDayAgo.toISOString(),
        datetime_leq: now.toISOString(),
        databaseId: env.D1_DATABASE_ID,
      },
    };

    // Cloudflare GraphQL API 호출
    const apiResponse = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Cloudflare API error: ${apiResponse.status} ${errorText}`);
    }

    const json: any = await apiResponse.json();

    if (json.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
    }

    const insights = json.data?.viewer?.accounts[0]?.d1AnalyticsAdaptiveGroups || [];

    return jsonResponse({ success: true, data: insights }, headers, 200);
 
}
