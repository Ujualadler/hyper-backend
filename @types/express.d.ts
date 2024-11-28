

import { UserDocument } from "../src/models/User"; // Adjust path as needed

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument; // Extend Request to include a user of type UserDocument
    }
  }
}

