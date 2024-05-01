const express = require('express');
const app = express();
const fileUpload = require('express-fileupload');
const cors = require('cors');

app.use(fileUpload());
app.use(cors({
    origin: "*"
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.post('/upload', (req, res) => {
    const file = req.files.file;
    console.log(file);
    res.send(`Archivo ${file.name} subido correctamente`);
});

app.listen(3001, () => {
    console.log('Server running on port 3001');
});