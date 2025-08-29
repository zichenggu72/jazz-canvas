import { ApolloServer } from 'apollo-server-micro';
import { gql } from 'apollo-server-micro';

// In-memory storage (for demo - use a database in production)
let canvases: any[] = [];
let activeCanvasId = 1;
let visitors = new Set<string>();

const typeDefs = gql`
  type Pixel {
    x: Int!
    y: Int!
    color: String!
  }

  type Canvas {
    id: ID!
    pixels: [Pixel!]!
    visitorCount: Int!
    isActive: Boolean!
    createdAt: String!
  }

  type VisitorResponse {
    visitorCount: Int!
  }

  type Query {
    activeCanvas: Canvas
    canvases: [Canvas!]!
  }

  type Mutation {
    addPixel(x: Int!, y: Int!, color: String!, visitorId: String!): Pixel
    clearCanvas(visitorId: String!): Boolean
    saveCanvas(visitorId: String!, isCollaborative: Boolean): Boolean
    trackVisitor(visitorId: String!): VisitorResponse
  }
`;

const resolvers = {
  Query: {
    activeCanvas: () => {
      let canvas = canvases.find(c => c.id === activeCanvasId);
      if (!canvas) {
        canvas = {
          id: activeCanvasId,
          pixels: [],
          visitorCount: visitors.size,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        canvases.push(canvas);
      }
      return canvas;
    },
    canvases: () => canvases.filter(c => !c.isActive),
  },

  Mutation: {
    addPixel: (_: any, { x, y, color, visitorId }: any) => {
      visitors.add(visitorId);
      
      let canvas = canvases.find(c => c.id === activeCanvasId);
      if (!canvas) {
        canvas = {
          id: activeCanvasId,
          pixels: [],
          visitorCount: visitors.size,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        canvases.push(canvas);
      }

      // Remove existing pixel at this position
      canvas.pixels = canvas.pixels.filter((p: any) => !(p.x === x && p.y === y));
      
      // Add new pixel
      const pixel = { x, y, color };
      canvas.pixels.push(pixel);
      canvas.visitorCount = visitors.size;

      return pixel;
    },

    clearCanvas: (_: any, { visitorId }: any) => {
      visitors.add(visitorId);
      
      let canvas = canvases.find(c => c.id === activeCanvasId);
      if (canvas) {
        canvas.pixels = [];
        canvas.visitorCount = visitors.size;
      }
      return true;
    },

    saveCanvas: (_: any, { visitorId, isCollaborative }: any) => {
      visitors.add(visitorId);
      
      let canvas = canvases.find(c => c.id === activeCanvasId);
      if (canvas) {
        // Mark current canvas as inactive (saved)
        canvas.isActive = false;
        canvas.visitorCount = visitors.size;
        
        // Create new active canvas
        activeCanvasId++;
        const newCanvas = {
          id: activeCanvasId,
          pixels: [],
          visitorCount: 0,
          isActive: true,
          createdAt: new Date().toISOString()
        };
        canvases.push(newCanvas);
        
        // Reset visitor count for new canvas
        visitors.clear();
        
        return true;
      }
      return false;
    },

    trackVisitor: (_: any, { visitorId }: any) => {
      visitors.add(visitorId);
      
      let canvas = canvases.find(c => c.id === activeCanvasId);
      if (canvas) {
        canvas.visitorCount = visitors.size;
      }
      
      return { visitorCount: visitors.size };
    },
  },
};

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
});

const startServer = apolloServer.start();

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }

  await startServer;
  await apolloServer.createHandler({
    path: '/api/graphql',
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};