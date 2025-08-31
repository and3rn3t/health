import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import createWSClient from '@/lib/wsClient';

export default function WsHistoricalDemo() {
  const clientRef = useRef<ReturnType<typeof createWSClient> | null>(null);
  const [pages, setPages] = useState<number>(0);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const client = createWSClient({
      url: 'ws://localhost:3001',
      heartbeatMs: 15000,
      handlers: {
        historical_data_update: (page) => {
          setPages((p) => p + 1);
          setCount((c) => c + page.items.length);
          // If server wants explicit request for the next page, uncomment:
          // if (page.nextCursor) clientRef.current?.send({ type: 'get_more', cursor: page.nextCursor });
        },
      },
    });
    clientRef.current = client;
    return () => client.close();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>WS Historical Backfill (Demo)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground text-sm">
          Pages received: {pages}
        </div>
        <div className="text-muted-foreground text-sm">
          Items total: {count}
        </div>
      </CardContent>
    </Card>
  );
}
