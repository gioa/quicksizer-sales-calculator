
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createQuestionnaireInputSchema, 
  getQuestionnaireBySessionInputSchema,
  getCostEstimationInputSchema
} from './schema';

// Import handlers
import { createQuestionnaire } from './handlers/create_questionnaire';
import { getQuestionnaireBySession } from './handlers/get_questionnaire_by_session';
import { calculateCostEstimation } from './handlers/calculate_cost_estimation';
import { getCostEstimation } from './handlers/get_cost_estimation';
import { getCostCalculationResult } from './handlers/get_cost_calculation_result';
import { getAllQuestionnaires } from './handlers/get_all_questionnaires';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new questionnaire response
  createQuestionnaire: publicProcedure
    .input(createQuestionnaireInputSchema)
    .mutation(({ input }) => createQuestionnaire(input)),
  
  // Get questionnaire by session ID
  getQuestionnaireBySession: publicProcedure
    .input(getQuestionnaireBySessionInputSchema)
    .query(({ input }) => getQuestionnaireBySession(input)),
  
  // Get cost estimation by questionnaire ID
  getCostEstimation: publicProcedure
    .input(getCostEstimationInputSchema)
    .query(({ input }) => getCostEstimation(input)),
  
  // Get complete cost calculation result (questionnaire + estimation)
  getCostCalculationResult: publicProcedure
    .input(getQuestionnaireBySessionInputSchema)
    .query(({ input }) => getCostCalculationResult(input)),
  
  // Get all questionnaires (for admin/sales team)
  getAllQuestionnaires: publicProcedure
    .query(() => getAllQuestionnaires()),
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
  console.log(`Quicksizer Calculator TRPC server listening at port: ${port}`);
}

start();
