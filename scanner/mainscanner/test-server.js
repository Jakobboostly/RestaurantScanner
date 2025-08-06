import express from 'express';

const app = express();
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Simple test server working!' });
});

const port = 3001;
app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});