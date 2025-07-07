
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema, 
  createPurchaseRequestInputSchema, 
  updatePurchaseRequestStatusInputSchema 
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { createPurchaseRequest } from './handlers/create_purchase_request';
import { getPurchaseRequests } from './handlers/get_purchase_requests';
import { getPurchaseRequestsByEmployee } from './handlers/get_purchase_requests_by_employee';
import { updatePurchaseRequestStatus } from './handlers/update_purchase_request_status';
import { enrichItemData } from './handlers/enrich_item_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  // Purchase request management
  createPurchaseRequest: publicProcedure
    .input(createPurchaseRequestInputSchema)
    .mutation(({ input }) => createPurchaseRequest(input)),
  
  getPurchaseRequests: publicProcedure
    .query(() => getPurchaseRequests()),
  
  getPurchaseRequestsByEmployee: publicProcedure
    .input(z.object({ employeeId: z.number() }))
    .query(({ input }) => getPurchaseRequestsByEmployee(input.employeeId)),
  
  updatePurchaseRequestStatus: publicProcedure
    .input(updatePurchaseRequestStatusInputSchema)
    .mutation(({ input }) => updatePurchaseRequestStatus(input)),
  
  // Item enrichment
  enrichItemData: publicProcedure
    .input(z.object({ amazonAsin: z.string() }))
    .query(({ input }) => enrichItemData(input.amazonAsin)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
