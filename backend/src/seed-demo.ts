import 'reflect-metadata';
import { connect, Types } from 'mongoose';
import { IncidentSeverity } from './common/enums/incident-severity.enum.js';
import { IncidentStatus } from './common/enums/incident-status.enum.js';
import { Incident, IncidentSchema } from './incidents/schemas/incident.schema.js';

const DEMO_OPERATOR_ID = '00000000-0000-4000-8000-000000000001';

const DEMO_INCIDENTS = [
  {
    id: '66f000000000000000000001',
    title: 'Checkout requests failing in us-east',
    description: 'Elevated 5xx responses from the checkout API after the latest deployment. The on-call engineer is checking the new payment adapter.',
    severity: IncidentSeverity.Critical,
    status: IncidentStatus.InProgress,
  },
  {
    id: '66f000000000000000000002',
    title: 'Payment API latency spike',
    description: 'P95 latency has exceeded the service objective for ten minutes. Requests are succeeding but some customers may see slow confirmation.',
    severity: IncidentSeverity.Critical,
    status: IncidentStatus.Open,
  },
  {
    id: '66f000000000000000000003',
    title: 'Webhook delivery backlog',
    description: 'The delivery queue is growing for one integration partner. Retrying workers are healthy and the backlog is being drained.',
    severity: IncidentSeverity.Medium,
    status: IncidentStatus.InProgress,
  },
  {
    id: '66f000000000000000000004',
    title: 'Operations dashboard metrics delayed',
    description: 'The metrics dashboard is showing data several minutes behind real time. Customer-facing services are unaffected.',
    severity: IncidentSeverity.Low,
    status: IncidentStatus.Open,
  },
  {
    id: '66f000000000000000000005',
    title: 'CDN cache invalidation errors',
    description: 'A subset of static assets remained cached after a release. Cache invalidation completed and the latest assets are now served.',
    severity: IncidentSeverity.Medium,
    status: IncidentStatus.Resolved,
  },
  {
    id: '66f000000000000000000006',
    title: 'Background worker restart loop',
    description: 'One worker pool restarted repeatedly after a configuration change. The configuration was rolled back and the pool is stable.',
    severity: IncidentSeverity.Low,
    status: IncidentStatus.Resolved,
  },
] as const;

async function seedDemoIncidents() {
  if (process.env.SEED_DEMO_DATA !== 'true') {
    console.log('Demo seeding is disabled (set SEED_DEMO_DATA=true to enable it).');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required to seed demo incidents.');

  const connection = await connect(uri);
  try {
    const incidents = connection.model(Incident.name, IncidentSchema);
    let inserted = 0;

    for (const seed of DEMO_INCIDENTS) {
      const result = await incidents.updateOne(
        { _id: new Types.ObjectId(seed.id) },
        {
          $setOnInsert: {
            title: seed.title,
            description: seed.description,
            severity: seed.severity,
            status: seed.status,
            assignedUserId: null,
            createdByUserId: DEMO_OPERATOR_ID,
            resolvedAt: seed.status === IncidentStatus.Resolved ? new Date() : null,
          },
        },
        { upsert: true },
      );
      inserted += result.upsertedCount;
    }

    console.log(`Demo seed complete: ${inserted} inserted; existing seed records preserved.`);
  } finally {
    await connection.disconnect();
  }
}

void seedDemoIncidents().catch((error: unknown) => {
  console.error('Demo seeding failed:', error);
  process.exitCode = 1;
});
