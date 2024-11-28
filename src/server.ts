import app from './app';
import connectToMongoDB from './config/database';

const port = process.env.PORT || 4000;



connectToMongoDB().then(() => {
  console.log("db connected")
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
