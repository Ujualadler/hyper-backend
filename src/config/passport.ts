import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Strategy Invoked");

        console.log(profile)

        // Check if a user exists with the given email
        let user = await User.findOne({ userEmail: profile.emails![0].value });
        const lastLogin = new Date();
        if (user) {
          // If the user exists but doesn't have a googleId, associate it
          if (!user.googleId) {
            user.googleId = profile.id;
            user.lastLoginTime = lastLogin;
            
            await user.save();
          }
        } else {
          // Create a new user if one doesn't exist
          user = new User({
            googleId: profile.id,
            userName: profile.displayName,
            userEmail: profile.emails![0].value,
            lastLoginTime: lastLogin,
          });
          await user.save();
        }

        done(null, user);
      } catch (err) {
        console.error("Error during Google authentication:", err);
        done(err, false);
      }
    }
  )
);

// Serialize user to store only user ID in session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user to retrieve full user details from the database
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
